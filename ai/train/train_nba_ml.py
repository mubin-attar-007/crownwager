"""Train + HONESTLY validate the NBA moneyline (home-win) XGBoost model.

Unlike the legacy script (which cherry-picked the best of 300 random splits and reported that as
"accuracy"), this uses a single fixed hold-out split + stratified k-fold cross-validation, so the
reported numbers are the real expected performance. It also exports the feature column order and a
per-team latest-stats snapshot so the AI service can serve the model on new games.

Run (inside the ai Docker image, with the archived data mounted):
    python ai/train/train_nba_ml.py --db /data/dataset.sqlite --out /app/ai/models
"""
from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path

DATASET_TABLE = "dataset_2012-24_new"
LABEL = "Home-Team-Win"
# Non-feature / leakage columns to drop (mirrors the legacy pipeline, which is correct here).
DROP = ["Score", LABEL, "TEAM_NAME", "Date", "TEAM_NAME.1", "Date.1", "OU-Cover", "OU"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", required=True, help="Path to dataset.sqlite")
    ap.add_argument("--out", required=True, help="Output dir (ai/models)")
    args = ap.parse_args()

    import numpy as np
    import pandas as pd
    import xgboost as xgb
    from sklearn.metrics import accuracy_score, log_loss, roc_auc_score
    from sklearn.model_selection import StratifiedKFold, train_test_split

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    con = sqlite3.connect(args.db)
    df = pd.read_sql_query(f'SELECT * FROM "{DATASET_TABLE}"', con, index_col="index")
    con.close()

    y = df[LABEL].astype(int).values
    X_df = df.drop(columns=[c for c in DROP if c in df.columns], errors="ignore")
    # Keep only numeric feature columns.
    X_df = X_df.select_dtypes(include=[np.number])
    feature_columns = list(X_df.columns)
    X = X_df.values.astype(float)
    print(f"Dataset: {X.shape[0]} games, {X.shape[1]} features. Home-win base rate: {y.mean():.3f}")

    params = dict(
        max_depth=3, learning_rate=0.01, n_estimators=750, subsample=0.9,
        colsample_bytree=0.9, objective="binary:logistic", eval_metric="logloss",
        n_jobs=4,
    )

    # ── Honest single hold-out split ──────────────────────────────
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    model = xgb.XGBClassifier(**params)
    model.fit(Xtr, ytr)
    proba = model.predict_proba(Xte)[:, 1]
    holdout = {
        "accuracy": float(accuracy_score(yte, (proba >= 0.5).astype(int))),
        "log_loss": float(log_loss(yte, proba)),
        "roc_auc": float(roc_auc_score(yte, proba)),
        "n_test": int(len(yte)),
    }

    # ── 5-fold stratified CV (robust mean) ────────────────────────
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    accs = []
    for tr, te in skf.split(X, y):
        m = xgb.XGBClassifier(**params)
        m.fit(X[tr], y[tr])
        accs.append(accuracy_score(y[te], (m.predict_proba(X[te])[:, 1] >= 0.5).astype(int)))
    cv = {"cv_accuracy_mean": float(np.mean(accs)), "cv_accuracy_std": float(np.std(accs))}

    # ── Persist model + feature order + metrics ───────────────────
    model_path = out / "xgboost_nba_ml.json"
    model.save_model(str(model_path))
    (out / "xgboost_nba_ml.features.json").write_text(json.dumps(feature_columns))
    metrics = {"model": "xgboost_nba_ml", **holdout, **cv, "n_features": len(feature_columns)}
    (out / "xgboost_nba_ml.metrics.json").write_text(json.dumps(metrics, indent=2))

    sha = __import__("hashlib").sha256(model_path.read_bytes()).hexdigest()
    print("HOLD-OUT:", json.dumps(holdout, indent=2))
    print("CV:", json.dumps(cv, indent=2))
    print("sha256:", sha)

    # ── Export per-team latest stats snapshot (for serving) ───────
    # For each team, take its most recent row's home-side stat columns (non-".1").
    home_cols = [c for c in feature_columns if not c.endswith(".1")]
    snap_df = df.copy()
    snap_df["__d"] = pd.to_datetime(snap_df["Date"], errors="coerce")
    snap_df = snap_df.sort_values("__d")
    team_features: dict[str, dict] = {}
    for team, grp in snap_df.groupby("TEAM_NAME"):
        last = grp.iloc[-1]
        team_features[str(team)] = {c: float(last[c]) for c in home_cols if c in last}
    (out / "team_features.json").write_text(json.dumps(team_features))
    print(f"Exported team_features for {len(team_features)} teams; {len(home_cols)} stats each.")


if __name__ == "__main__":
    main()

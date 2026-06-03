"""Reference training script for the XGBoost moneyline model.

This is a clean rewrite of the legacy ``nba_betting/src/Train-Models/XGBoost_Model_ML.py`` intent:
load a feature matrix + labels, train with a train/val/test split, and persist the model plus a
metrics report. It is intentionally data-source-agnostic — point ``--data`` at a prepared CSV.

Usage:
    python -m ai.train.train_xgboost --data prepared.csv --out ai/models/xgboost_ml.json
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the XGBoost moneyline model.")
    parser.add_argument("--data", required=True, help="CSV with feature columns + a 'home_win' label.")
    parser.add_argument("--out", default="ai/models/xgboost_ml.json")
    parser.add_argument("--test-size", type=float, default=0.2)
    args = parser.parse_args()

    import numpy as np  # local imports so the service image needn't import these at runtime
    import pandas as pd
    import xgboost as xgb
    from sklearn.metrics import accuracy_score, log_loss
    from sklearn.model_selection import train_test_split

    df = pd.read_csv(args.data)
    label = "home_win"
    X = df.drop(columns=[label]).values
    y = df[label].values
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42, stratify=y
    )

    model = xgb.XGBClassifier(
        max_depth=3, eta=0.01, n_estimators=750, subsample=0.8,
        objective="binary:logistic", eval_metric="logloss",
    )
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    metrics = {
        "accuracy": float(accuracy_score(y_test, (proba >= 0.5).astype(int))),
        "log_loss": float(log_loss(y_test, proba)),
        "n_test": int(len(y_test)),
    }
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    model.save_model(args.out)
    Path(args.out + ".metrics.json").write_text(json.dumps(metrics, indent=2))
    print("Saved model:", args.out)
    print("Metrics:", metrics)
    print("Remember: update model_manifest.yaml (file + sha256 + validated) before serving.")


if __name__ == "__main__":
    main()

# ML Models

## Current state

The AI service ships with a **transparent baseline model** (`baseline-v0`): a logistic function over
home-court advantage, an optional team-rating differential, and a rest-day differential. It is always
available and clearly labelled (`validated: false`) so the platform runs and is honest about its
confidence.

## Why the legacy models aren't served yet

The legacy project shipped pre-trained NN (Keras SavedModel) and XGBoost (JSON) binaries with
**unverified** accuracy claims (e.g. "68%"), timestamp-only provenance, no checksums, and training data
sourced live from external APIs (so the exact training set can't be reproduced). The assessment flagged
these as *unknown commercial value pending validation*. They are preserved under
`_archived/legacy_crownwager/nba_betting/Models/`.

## Promoting a validated model

1. **Prepare data** — re-collect and snapshot the feature set (see `ai/data/dataset_manifest.yaml`).
2. **Train** — `python -m ai.train.train_xgboost --data prepared.csv --out ai/models/xgboost_ml.json`.
3. **Validate** — `python -m ai.train.evaluate_backtest --predictions preds.csv` and confirm accuracy +
   ROI clear your threshold on a **held-out** sample. This is the gate.
4. **Register** — copy the binary into `ai/models/`, fill `file` + `sha256` in
   `ai/models/model_manifest.yaml`, and set `validated: true`.
5. The registry will then serve it (checksum-verified); `prediction_engine.py` is where inference plugs in.

## Design notes

- The engine emits an authoritative `ensemble` pick (used by best-bets) plus deterministic `nn`/`xgboost`
  display variants — no randomness, so the demo is reproducible.
- Probabilities map to picks that match the offered odds selection, so `compute_best_bets` can always
  pair a model probability with a market price to compute edge/EV/Kelly.
- The service is **decoupled** from the web process (its own container, Python 3.12) so the heavy ML
  stack never blocks API requests, and the backend degrades gracefully if it's down.

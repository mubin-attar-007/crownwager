"""Backtest / validation harness — the gate that decides whether a model may be served.

The legacy project surfaced model accuracy claims (e.g. "68%") that were never validated against
held-out data or real betting outcomes. This script evaluates a model's predictions against actual
results and reports accuracy, log-loss, and a flat-stake ROI, so a model is only promoted to
``validated: true`` once its edge is demonstrated.

Usage:
    python -m ai.train.evaluate_backtest --predictions preds.csv
        (CSV columns: model_prob, american_odds, won)
"""
from __future__ import annotations

import argparse
import csv


def american_to_decimal(american: float) -> float:
    return (american / 100) + 1 if american >= 100 else (100 / abs(american)) + 1


def main() -> None:
    parser = argparse.ArgumentParser(description="Backtest a model's predictions.")
    parser.add_argument("--predictions", required=True)
    parser.add_argument("--stake", type=float, default=100.0)
    args = parser.parse_args()

    n = correct = 0
    pnl = 0.0
    eps = 1e-9
    ll = 0.0
    import math

    with open(args.predictions, newline="") as fh:
        for row in csv.DictReader(fh):
            p = float(row["model_prob"])
            odds = float(row["american_odds"])
            won = int(row["won"])
            n += 1
            pred = 1 if p >= 0.5 else 0
            correct += int(pred == won)
            ll += -(won * math.log(p + eps) + (1 - won) * math.log(1 - p + eps))
            dec = american_to_decimal(odds)
            pnl += (args.stake * (dec - 1)) if won else -args.stake

    if n == 0:
        print("No rows.")
        return
    staked = args.stake * n
    print(f"n={n}  accuracy={correct / n:.4f}  log_loss={ll / n:.4f}")
    print(f"flat-stake ROI={pnl / staked:+.4%}  (pnl={pnl:+.2f} on {staked:.0f} staked)")
    print("Promote to validated only if accuracy and ROI clear your threshold on a fresh sample.")


if __name__ == "__main__":
    main()

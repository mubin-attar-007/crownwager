"""One-off: inspect the archived legacy NBA SQLite datasets to scope model training."""
import os
import sqlite3

BASE = os.path.join(
    os.path.dirname(__file__), "..", "..",
    "_archived", "legacy_oddsaway", "nba_betting", "Data",
)

for db in ["dataset.sqlite", "TeamData.sqlite", "OddsData.sqlite"]:
    path = os.path.join(BASE, db)
    if not os.path.exists(path):
        print(f"{db}: MISSING")
        continue
    con = sqlite3.connect(path)
    tabs = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")]
    print(f"=== {db} === ({len(tabs)} tables)")
    for t in tabs[:8]:
        n = con.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
        cols = [d[1] for d in con.execute(f'PRAGMA table_info("{t}")')]
        print(f"  {t}: {n} rows, {len(cols)} cols")
        print(f"    cols[:24]: {cols[:24]}")
    if len(tabs) > 8:
        print(f"  ... +{len(tabs) - 8} more tables")
    con.close()
    print()

## What & why
<!-- One or two sentences: what changed and the motivation. -->

## Checklist
- [ ] Backend: `ruff check .`, `bandit --severity-level medium` clean, `pytest -q` pass
- [ ] Frontend: `npm run build` + `npm test` pass (if changed)
- [ ] No secrets committed (render.yaml uses `sync: false`; gitleaks clean)
- [ ] Django migrations included for model changes; `manage.py check` passes
- [ ] Auth / admin / rate-limit guardrails not weakened
- [ ] Docs updated if behavior or config changed

ML training tests include:

- `unit/`: metric and data preparation checks
- `integration/`: small-sample pipeline fit checks

Run locally:

```bash
cd services/ml-training
PYTHONPATH=. pytest -q
```

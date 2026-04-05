ML API tests include:

- `unit/`: pure logic checks
- `load/`: model store loading behavior
- `integration/`: endpoint-level checks

Run locally:

```bash
cd services/ml-api
PYTHONPATH=. pytest -q
```

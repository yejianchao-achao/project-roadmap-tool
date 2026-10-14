"""Create missing JSON stores while preserving every existing data file."""
import json
import os
from pathlib import Path

data_dir = Path(__file__).resolve().parents[1] / 'data'
data_dir.mkdir(parents=True, exist_ok=True)
for name in ('projects', 'productlines'):
    path = data_dir / f'{name}.json'
    try:
        with path.open('x', encoding='utf-8') as handle:
            json.dump({name: []}, handle, ensure_ascii=False, indent=2)
        os.chmod(path, 0o640)
        print(f'Initialized {path}')
    except FileExistsError:
        with path.open(encoding='utf-8') as handle:
            value = json.load(handle)
        if not isinstance(value, dict) or not isinstance(value.get(name), list):
            raise ValueError(f'Invalid existing store: {path}')
        print(f'Preserved {path}')

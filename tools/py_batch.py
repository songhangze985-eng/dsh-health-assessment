"""批量跑上游 Python 计分器，供 JS 内核做差分对照。

输入一个 JSON 数组（每组是一个 score_payload），输出等长结果数组。
一个进程跑完全部样本，避免 500 次解释器启动开销。

用法：python3 tools/py_batch.py <in.json> <out.json>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'upstream' / 'scripts'))
sys.path.insert(0, str(ROOT.parent / 'src-health-assessment' / 'scripts'))

from score_checkin import score_payload  # noqa: E402


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    payloads = json.loads(Path(src).read_text(encoding='utf-8'))
    results = [score_payload(item) for item in payloads]
    Path(dst).write_text(json.dumps(results, ensure_ascii=False), encoding='utf-8')
    print(f'scored {len(results)}')


if __name__ == '__main__':
    main()

"""Collect the metrics JSON files into one side-by-side table (reports/results.md).

Run after evaluate.py and llm_baseline.py:  python src/compare.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "reports"

RUNS = [
    ("Fine-tuned DistilBERT (CPU)", "finetuned_metrics.json"),
    ("Claude Opus 5.5, zero-shot", "claude_zero_shot_metrics.json"),
    ("Claude Opus 5.5, few-shot (18 examples)", "claude_few_shot_metrics.json"),
]


def fmt_pct(x):
    return "n/a" if x is None else f"{x:.1%}"


def fmt_ms(x):
    return "n/a" if x is None else (f"{x:,.0f} ms" if x >= 10 else f"{x:.1f} ms")


def main() -> None:
    rows, per_class = [], {}
    for name, file in RUNS:
        path = REPORTS / file
        if not path.exists():
            rows.append(f"| {name} | not run yet | | | | | |")
            continue
        m = json.loads(path.read_text())
        cost_1k = m.get("cost_usd_per_1k_tickets")
        cost = "$0 (own hardware)" if m["cost_usd_total"] == 0 else f"${m['cost_usd_total']:.2f} (${cost_1k:.2f} / 1k)"
        rows.append(
            f"| {name} | {fmt_pct(m['accuracy'])} | {m['macro_f1']:.3f} "
            f"| {fmt_pct(m['accuracy_novel']['accuracy'])} "
            f"| {fmt_ms(m['latency_ms_median'])} | {fmt_ms(m['latency_ms_p95'])} | {cost} |"
        )
        per_class[name] = {k: v["f1-score"] for k, v in m["per_class"].items()}
        n = m["n"]
        n_novel = m["accuracy_novel"]["n"]

    out = [
        f"Test set: {n} tickets ({n_novel} with no near-duplicate in the training data).",
        "",
        "| Model | Accuracy | Macro F1 | Accuracy on novel tickets | Median latency | p95 latency | Cost for test set |",
        "|---|---|---|---|---|---|---|",
        *rows,
        "",
        "Per-category F1:",
        "",
        "| Category | " + " | ".join(per_class) + " |",
        "|---|" + "---|" * len(per_class),
    ]
    labels = next(iter(per_class.values())).keys()
    for lbl in labels:
        out.append(f"| {lbl} | " + " | ".join(f"{pc[lbl]:.2f}" for pc in per_class.values()) + " |")

    text = "\n".join(out) + "\n"
    (REPORTS / "results.md").write_text(text)
    print(text)


if __name__ == "__main__":
    main()

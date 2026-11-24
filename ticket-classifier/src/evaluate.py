"""Evaluate the fine-tuned model on the held-out test set.

Run:  python src/evaluate.py
Writes reports/finetuned_metrics.json, reports/finetuned_predictions.csv and
reports/confusion_matrix_finetuned.png.
"""

import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import torch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src.metrics import print_report, save_confusion_matrix, score, seen_in_train_mask  # noqa: E402
from src.predict import DEFAULT_MODEL_DIR, TicketClassifier  # noqa: E402

REPORTS = ROOT / "reports"


def dir_size_mb(path: Path) -> float:
    return sum(f.stat().st_size for f in path.rglob("*") if f.is_file()) / 1e6


def main() -> None:
    REPORTS.mkdir(exist_ok=True)
    train = pd.read_csv(ROOT / "data" / "train.csv")
    test = pd.read_csv(ROOT / "data" / "test.csv")
    texts, y_true = test["text"].tolist(), test["label"].tolist()

    clf = TicketClassifier()
    labels = sorted(clf.labels)

    # Accuracy pass (batched, fast)
    preds = []
    for i in range(0, len(texts), 32):
        preds += clf.predict_batch(texts[i:i + 32])
    y_pred = [p["category"] for p in preds]

    # Latency pass: one ticket per call, like a real API request
    clf.predict(texts[0])  # warm-up
    latencies = []
    for t in texts:
        start = time.perf_counter()
        clf.predict(t)
        latencies.append((time.perf_counter() - start) * 1000)

    seen = seen_in_train_mask(texts, train["text"])
    metrics = score(y_true, y_pred, labels, seen_mask=seen)
    metrics.update({
        "model": "distilbert-base-uncased (fine-tuned)",
        "hardware": f"CPU, {torch.get_num_threads()} threads",
        "latency_ms_median": round(float(np.median(latencies)), 1),
        "latency_ms_p95": round(float(np.percentile(latencies, 95)), 1),
        "cost_usd_total": 0.0,
        "cost_note": "No per-request fee; runs on your own CPU.",
        "model_size_mb": round(dir_size_mb(DEFAULT_MODEL_DIR), 1),
    })

    print_report(y_true, y_pred, labels)
    print(json.dumps({k: v for k, v in metrics.items() if k != "per_class"}, indent=2))

    (REPORTS / "finetuned_metrics.json").write_text(json.dumps(metrics, indent=2))
    test.assign(
        predicted=y_pred,
        confidence=[p["confidence"] for p in preds],
        near_duplicate_of_train=seen,
    ).to_csv(REPORTS / "finetuned_predictions.csv", index=False)
    save_confusion_matrix(
        y_true, y_pred, labels, REPORTS / "confusion_matrix_finetuned.png",
        f"Fine-tuned DistilBERT (accuracy {metrics['accuracy']:.1%})",
    )


if __name__ == "__main__":
    main()

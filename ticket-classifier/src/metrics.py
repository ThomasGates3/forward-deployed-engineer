"""Scoring helpers shared by the fine-tuned model and the Claude baseline,
so both are measured with exactly the same code."""

from __future__ import annotations

import re
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)


def template_key(text: str) -> str:
    """Normalise a ticket so auto-generated copies that differ only in masked
    placeholders ([NAME], [TICKET ID]...), numbers or punctuation look identical."""
    text = re.sub(r"\[[A-Z _]+\]", " ", text).lower()  # drop [NAME], [TICKET ID], ...
    text = re.sub(r"[^a-zà-ÿ]+", " ", text)  # drop numbers and punctuation
    return " ".join(text.split())


def seen_in_train_mask(test_texts, train_texts) -> np.ndarray:
    """True for test tickets whose normalised text also appears in the training set."""
    train_keys = {template_key(t) for t in train_texts}
    return np.array([template_key(t) in train_keys for t in test_texts])


def score(y_true, y_pred, labels: list[str], seen_mask: np.ndarray | None = None) -> dict:
    y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
    out = {
        "n": int(len(y_true)),
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 6),
        "macro_f1": round(float(f1_score(y_true, y_pred, labels=labels, average="macro", zero_division=0)), 4),
        "weighted_f1": round(float(f1_score(y_true, y_pred, labels=labels, average="weighted", zero_division=0)), 4),
        "per_class": {
            k: {m: round(float(v[m]), 4) for m in ("precision", "recall", "f1-score", "support")}
            for k, v in classification_report(
                y_true, y_pred, labels=labels, output_dict=True, zero_division=0
            ).items()
            if k in labels
        },
    }
    if seen_mask is not None:
        for name, mask in (("near_duplicate_of_train", seen_mask), ("novel", ~seen_mask)):
            out[f"accuracy_{name}"] = {
                "n": int(mask.sum()),
                "accuracy": round(float(accuracy_score(y_true[mask], y_pred[mask])), 6) if mask.any() else None,
            }
    return out


def print_report(y_true, y_pred, labels: list[str]) -> None:
    print(classification_report(y_true, y_pred, labels=labels, digits=3, zero_division=0))


def save_confusion_matrix(y_true, y_pred, labels: list[str], path: Path, title: str) -> None:
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    fig, ax = plt.subplots(figsize=(7.5, 6.5))
    ConfusionMatrixDisplay(cm, display_labels=labels).plot(
        ax=ax, cmap="Blues", colorbar=False, xticks_rotation=35
    )
    ax.set_title(title)
    ax.set_xlabel("Predicted category")
    ax.set_ylabel("True category")
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)

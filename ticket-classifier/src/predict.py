"""Load the fine-tuned model once and classify ticket text.

    from src.predict import TicketClassifier
    clf = TicketClassifier()
    clf.predict("Outlook keeps asking for my password")
    # {'category': 'O365', 'confidence': 0.93, 'scores': {...}}
"""

from __future__ import annotations

import os
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_DIR = Path(os.environ.get("MODEL_DIR", ROOT / "models" / "distilbert-tickets"))
MAX_LENGTH = 128


class TicketClassifier:
    def __init__(self, model_dir: str | Path = DEFAULT_MODEL_DIR):
        model_dir = Path(model_dir)
        if not (model_dir / "config.json").exists():
            raise FileNotFoundError(
                f"No trained model at {model_dir}. Run `python src/train.py` first."
            )
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_dir)
        self.model.eval()  # turn off dropout: same input -> same output
        self.labels = [self.model.config.id2label[i] for i in range(self.model.config.num_labels)]

    @torch.inference_mode()  # no gradient bookkeeping: faster, less memory
    def predict_batch(self, texts: list[str]) -> list[dict]:
        if not texts:
            return []
        enc = self.tokenizer(
            texts, truncation=True, max_length=MAX_LENGTH, padding=True, return_tensors="pt"
        )
        logits = self.model(**enc).logits
        probs = torch.softmax(logits, dim=-1)  # raw scores -> probabilities that sum to 1
        results = []
        for row in probs:
            idx = int(row.argmax())
            results.append({
                "category": self.labels[idx],
                "confidence": round(float(row[idx]), 4),
                "scores": {lbl: round(float(p), 4) for lbl, p in zip(self.labels, row)},
            })
        return results

    def predict(self, text: str) -> dict:
        if not text or not text.strip():
            raise ValueError("Ticket text must not be empty.")
        return self.predict_batch([text])[0]

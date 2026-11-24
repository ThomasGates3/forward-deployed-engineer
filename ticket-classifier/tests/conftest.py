from pathlib import Path

import pytest

MODEL_DIR = Path(__file__).resolve().parent.parent / "models" / "distilbert-tickets"
LABELS = ["Active Directory", "Computer-Services", "Fileservice", "O365", "Software", "Support general"]

requires_model = pytest.mark.skipif(
    not (MODEL_DIR / "config.json").exists(),
    reason="Trained model not found; run `python src/train.py` first.",
)


@pytest.fixture(scope="session")
def classifier():
    from src.predict import TicketClassifier
    return TicketClassifier(MODEL_DIR)

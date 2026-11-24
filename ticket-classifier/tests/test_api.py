import pytest
from fastapi.testclient import TestClient

from src.api import create_app
from tests.conftest import LABELS, requires_model


class FakeClassifier:
    """Stands in for the real model so API tests run in milliseconds."""

    labels = LABELS

    def predict(self, text: str) -> dict:
        scores = {lbl: 0.02 for lbl in LABELS}
        scores["O365"] = 0.9
        return {"category": "O365", "confidence": 0.9, "scores": scores}


@pytest.fixture
def client():
    with TestClient(create_app(FakeClassifier)) as c:  # `with` runs the startup hook
        yield c


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "categories": LABELS}


def test_classify_returns_category_and_confidence(client):
    r = client.post("/classify", json={"text": "Outlook will not send email"})
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "O365"
    assert body["confidence"] == pytest.approx(0.9)
    assert set(body["scores"]) == set(LABELS)


@pytest.mark.parametrize("payload", [{}, {"text": ""}, {"text": "   "}, {"text": "x" * 10_001}, {"text": 123}])
def test_classify_rejects_bad_input(client, payload):
    assert client.post("/classify", json=payload).status_code == 422


@requires_model
def test_classify_with_real_model():
    from src.api import app

    with TestClient(app) as c:
        r = c.post("/classify", json={"text": "Please grant me access to the finance file share"})
    assert r.status_code == 200
    body = r.json()
    assert body["category"] in LABELS
    assert 0.0 <= body["confidence"] <= 1.0

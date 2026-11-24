import pytest

from src.metrics import score, seen_in_train_mask, template_key
from tests.conftest import LABELS, requires_model

# ---------- metric helpers (no model needed) ----------


def test_template_key_ignores_placeholders_numbers_and_punctuation():
    a = "File Share Access - [TICKET ID] - [NAME] ([COMPANY]. [LOCATION])"
    b = "File Share Access - 12345 - [NAME]"
    assert template_key(a) == template_key(b) == "file share access"


def test_seen_in_train_mask():
    mask = seen_in_train_mask(["File Share Access - [NAME]", "printer broken"], ["File share access - 99"])
    assert mask.tolist() == [True, False]


def test_score_counts_errors_as_wrong():
    out = score(["O365", "Software"], ["O365", "ERROR"], LABELS)
    assert out["accuracy"] == 0.5
    assert out["per_class"]["O365"]["recall"] == 1.0


# ---------- real model ----------


@requires_model
def test_predict_output_is_well_formed(classifier):
    result = classifier.predict("My laptop screen is flickering and the computer is very slow")
    assert result["category"] in LABELS
    assert set(result["scores"]) == set(LABELS)
    assert sum(result["scores"].values()) == pytest.approx(1.0, abs=1e-3)
    # confidence is the probability of the chosen category, which is the highest one
    assert result["confidence"] == max(result["scores"].values())


@requires_model
def test_predict_is_deterministic(classifier):
    text = "Cannot open shared mailbox in Outlook"
    assert classifier.predict(text) == classifier.predict(text)


@requires_model
def test_predict_batch_matches_single(classifier):
    texts = ["Install Java on the build server", "Reset my password please"]
    batch = classifier.predict_batch(texts)
    assert len(batch) == 2
    assert [b["category"] for b in batch] == [classifier.predict(t)["category"] for t in texts]


@requires_model
def test_predict_rejects_empty_text(classifier):
    with pytest.raises(ValueError):
        classifier.predict("   ")


@requires_model
def test_obvious_ticket_is_classified_correctly(classifier):
    # A templated ticket type that appears many times in training data.
    assert classifier.predict("File Share Access - [TICKET ID] - [NAME]")["category"] == "Fileservice"

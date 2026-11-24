"""Fine-tune distilbert-base-uncased on the ticket data with the Hugging Face Trainer (PyTorch).

Run:  python src/train.py
Saves the model + tokenizer to models/distilbert-tickets/.
"""

import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from datasets import Dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
    set_seed,
)

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
MODEL_DIR = ROOT / "models" / "distilbert-tickets"
REPORTS = ROOT / "reports"

BASE_MODEL = "distilbert-base-uncased"
MAX_LENGTH = 128
EPOCHS = 3
BATCH_SIZE = 16
LEARNING_RATE = 5e-5
SEED = 42


def main() -> None:
    set_seed(SEED)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Training on: {device}")

    train_df = pd.read_csv(DATA / "train.csv")
    labels = sorted(train_df["label"].unique())
    label2id = {name: i for i, name in enumerate(labels)}
    id2label = {i: name for name, i in label2id.items()}

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

    # How many tickets get cut off at MAX_LENGTH tokens?
    lengths = [len(ids) for ids in tokenizer(train_df["text"].tolist())["input_ids"]]
    truncated = np.mean(np.array(lengths) > MAX_LENGTH) * 100
    print(f"Token length median: {int(np.median(lengths))}, "
          f"{truncated:.1f}% of tickets truncated at {MAX_LENGTH} tokens")

    def tokenize(batch):
        # No padding here: the data collator pads each batch to its own longest ticket.
        return tokenizer(batch["text"], truncation=True, max_length=MAX_LENGTH)

    train_ds = Dataset.from_pandas(
        train_df.assign(labels=train_df["label"].map(label2id))[["text", "labels"]]
    ).map(tokenize, batched=True, remove_columns=["text"])

    # Pretrained DistilBERT body + a new, randomly initialised 6-way classification head.
    model = AutoModelForSequenceClassification.from_pretrained(
        BASE_MODEL, num_labels=len(labels), id2label=id2label, label2id=label2id
    )

    args = TrainingArguments(
        output_dir=str(ROOT / "models" / "checkpoints"),
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
        weight_decay=0.01,
        warmup_steps=0.1,  # float < 1 = fraction of total steps (Transformers 5 API)
        logging_steps=10,
        save_strategy="no",  # we save the final model ourselves
        report_to="none",
        seed=SEED,
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        processing_class=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer),
    )

    start = time.perf_counter()
    result = trainer.train()
    minutes = (time.perf_counter() - start) / 60
    print(f"Training finished in {minutes:.1f} min, final train loss {result.training_loss:.4f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(MODEL_DIR))
    tokenizer.save_pretrained(str(MODEL_DIR))

    REPORTS.mkdir(exist_ok=True)
    loss_curve = [
        {"step": e["step"], "epoch": round(e["epoch"], 2), "loss": e["loss"]}
        for e in trainer.state.log_history if "loss" in e
    ]
    (REPORTS / "train_log.json").write_text(json.dumps({
        "base_model": BASE_MODEL,
        "device": device,
        "torch_threads": torch.get_num_threads(),
        "train_examples": len(train_df),
        "epochs": EPOCHS,
        "batch_size": BATCH_SIZE,
        "learning_rate": LEARNING_RATE,
        "max_length": MAX_LENGTH,
        "pct_truncated": round(float(truncated), 1),
        "train_minutes": round(minutes, 1),
        "final_train_loss": round(result.training_loss, 4),
        "loss_curve": loss_curve,
    }, indent=2))
    print(f"Saved model to {MODEL_DIR}")


if __name__ == "__main__":
    main()

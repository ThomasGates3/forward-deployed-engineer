"""Download the real IT support ticket dataset, clean it, and make a fixed 80/20 split.

Source: tasksource/it-support-tickets on Hugging Face (CC BY 4.0), originally
"Classification of IT Support Tickets" by Leonardo Santiago Benitez Pereira,
DOI 10.5281/zenodo.7648117. Real tickets from an IT support company, labeled
by three IT support professionals, with PII masked as [NAME], [EMAIL], etc.

Outputs:
  data/tickets.csv  all unique tickets (text, label)
  data/train.csv    80% stratified split
  data/test.csv     20% stratified split (both models are scored on this file)
  reports/class_balance.png
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from datasets import load_dataset
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
REPORTS = ROOT / "reports"
SEED = 42
MIN_PER_CLASS = 20


def load_raw() -> pd.DataFrame:
    ds = load_dataset("tasksource/it-support-tickets")
    names = ds["train"].features["label"].names
    frames = []
    for split in ds:
        df = ds[split].to_pandas()
        df["label"] = df["label"].map(lambda i: names[i])
        frames.append(df)
    return pd.concat(frames, ignore_index=True)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # Collapse runs of whitespace/newlines so trivially different copies count as duplicates.
    df["text"] = df["text"].astype(str).str.replace(r"\s+", " ", regex=True).str.strip()
    df = df[df["text"].str.len() > 0]

    n_before = len(df)
    # Same text can appear several times (auto-generated tickets). If its copies
    # disagree on the label, keep the most common label for that text.
    conflicts = df.groupby("text")["label"].nunique()
    n_conflicting = int((conflicts > 1).sum())
    df = (
        df.groupby("text")["label"]
        .agg(lambda s: s.value_counts().index[0])
        .reset_index()
    )
    print(f"Rows before dedup: {n_before}  after: {len(df)}  "
          f"(texts with conflicting labels: {n_conflicting})")

    # A class needs enough unique examples to be learned and tested. "EOL" is a
    # single automated template repeated ~100 times, so only 2 unique texts survive.
    counts = df["label"].value_counts()
    too_small = counts[counts < MIN_PER_CLASS]
    if len(too_small):
        print(f"Dropping classes with < {MIN_PER_CLASS} unique tickets: {too_small.to_dict()}")
        df = df[~df["label"].isin(too_small.index)]
    return df.sample(frac=1, random_state=SEED).reset_index(drop=True)


def plot_balance(counts: pd.Series, path: Path) -> None:
    fig, ax = plt.subplots(figsize=(8, 4))
    counts.sort_values().plot.barh(ax=ax, color="#4C72B0")
    ax.set_xlabel("Number of tickets")
    ax.set_title("Class balance (unique tickets)")
    for i, v in enumerate(counts.sort_values()):
        ax.text(v + 3, i, str(v), va="center")
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def main() -> None:
    DATA.mkdir(exist_ok=True)
    REPORTS.mkdir(exist_ok=True)

    df = clean(load_raw())
    df.to_csv(DATA / "tickets.csv", index=False)

    train, test = train_test_split(
        df, test_size=0.2, stratify=df["label"], random_state=SEED
    )
    train.to_csv(DATA / "train.csv", index=False)
    test.to_csv(DATA / "test.csv", index=False)

    counts = df["label"].value_counts()
    table = pd.DataFrame({
        "total": counts,
        "share": (counts / counts.sum() * 100).round(1).astype(str) + "%",
        "train": train["label"].value_counts(),
        "test": test["label"].value_counts(),
    })
    print("\nClass balance:")
    print(table.to_string())
    print(f"\nTrain: {len(train)}  Test: {len(test)}")
    print(f"Median ticket length: {int(df['text'].str.len().median())} characters")
    plot_balance(counts, REPORTS / "class_balance.png")


if __name__ == "__main__":
    main()

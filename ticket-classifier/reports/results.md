Test set: 295 tickets (270 with no near-duplicate in the training data).

| Model | Accuracy | Macro F1 | Accuracy on novel tickets | Median latency | p95 latency | Cost for test set |
|---|---|---|---|---|---|---|
| Fine-tuned DistilBERT (CPU) | 76.9% | 0.705 | 76.3% | 16 ms | 33 ms | $0 (own hardware) |
| Claude Opus 5.5, zero-shot | 62.4% | 0.637 | 64.4% | 1,339 ms | 3,186 ms | $0.27 ($0.93 / 1k) |
| Claude Opus 5.5, few-shot (18 examples) | 66.4% | 0.685 | 68.1% | 812 ms | 2,083 ms | $0.41 ($1.40 / 1k) |

Per-category F1:

| Category | Fine-tuned DistilBERT (CPU) | Claude Opus 5.5, zero-shot | Claude Opus 5.5, few-shot (18 examples) |
|---|---|---|---|
| Active Directory | 0.35 | 0.40 | 0.47 |
| Computer-Services | 0.82 | 0.86 | 0.91 |
| Fileservice | 0.87 | 0.94 | 0.94 |
| O365 | 0.76 | 0.65 | 0.67 |
| Software | 0.60 | 0.51 | 0.64 |
| Support general | 0.83 | 0.46 | 0.48 |

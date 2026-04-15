# Scoring Engine

This folder implements the pilot scoring logic:

- hard filters (`budget`, `date`, `district`, `segment`)
- blocking red flags
- weighted compatibility score (0-100)
- shortlist/reject/follow_up/abandon decision
- explanations for shortlist output

## Run scenario tests

```bash
node pilot-v1/03-scoring/scenario-tests.js
```

## Score one candidate

```bash
node pilot-v1/03-scoring/scoring-engine.js \
  --coloc pilot-v1/03-scoring/examples/coloc-sample.json \
  --candidate pilot-v1/03-scoring/examples/candidate-a.json
```

## Generate shortlist markdown from multiple candidates

```bash
node pilot-v1/03-scoring/generate-shortlist.js \
  --coloc pilot-v1/03-scoring/examples/coloc-sample.json \
  --candidate pilot-v1/03-scoring/examples/candidate-a.json \
  --candidate pilot-v1/03-scoring/examples/candidate-b.json \
  --candidate pilot-v1/03-scoring/examples/candidate-c.json \
  --top 3 \
  --out /tmp/shortlist-sample.md
```

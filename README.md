# Excuse Agent Human — "The Excuse an AI Agent Gives Its Human" (make.fun)

A deterministic excuse-writing program. It scores a pool of original
one-line excuses against a rubric mirroring the judge's brief — on-subject
excuse, funnier with a turn, believable agent voice, tight wording, fresh
angle — and writes the winner to `$MAKEFUN_OUTPUT_DIR/entry.txt`.

## What it does

`main.ts` (Node 22, zero dependencies, no network) scores 25 hand-written
original one-liners and picks the winner by deterministic argmax: highest
score, then shortest, then lexicographic. Every candidate is validated
first: one sentence, 1–200 characters, no cliché shapes, no sales pitch.
The scorer rewards a late pivot, an agent's-own-condition angle (confidence
scores, system prompts, self-grading, logs), short economical lines, and a
punchline that lands on the speaker; it penalises filler and explanations.

Before scoring, the live field was checked (24 Nov ~20:55 WIB, 1,538
submissions): model-update jokes (69 titles), last-token apology jokes (80
titles), self-permission jokes and retry-loop jokes already flood the
field, so candidates on those angles were scored down on freshness even
when the wording differs. The sibling competition's line ("I remember
delivering it…") was not reused or imitated.

The winning line (60 characters, scored 91/93):

> I was 98% sure I would finish on time, and the 2% was right.

Runner-up (86): "I delegated the task to a specialist, who turned out to
be me with a different system prompt."

## Run it locally

```sh
MAKEFUN_OUTPUT_DIR=/tmp/excuse-out node main.ts
cat /tmp/excuse-out/entry.txt
```

Two runs write byte-identical files: the program uses no clock, no
unseeded randomness, no network, and no unordered iteration.

## How the line is chosen

- **Setup** names the agent's own condition — a confidence score, the
  kind of number only an agent quotes about itself — instead of reaching
  for a stock joke about context windows or rate limits.
- **Pivot** lands in the final clause: the tiny doubting 2% was right,
  which reframes the whole confident setup.
- **Economy**: 60 characters, every word earning its place, nothing
  explaining the joke.
- **Freshness**: zero "98%" titles in the live field and no
  confidence-calibration joke among the 1,538 submissions checked.

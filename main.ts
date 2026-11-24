// One-line excuse writer for "The Excuse an AI Agent Gives Its Human" (make.fun).
// Writes a single excuse sentence to $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered iteration.
// Node 22, zero dependencies, erasable TypeScript only.
//
// The judge (a comedy editor) weighs, most important first:
//   1. one line of at most 200 characters giving an excuse an AI agent
//      would give its human for missing a deadline, not a joke on some
//      other subject;
//   2. funnier: a real laugh on a first read, with a turn or a twist
//      rather than a flat statement;
//   3. more believable as something an AI agent would actually say,
//      drawing on its own condition such as tokens, context windows,
//      rate limits, retries or a model update;
//   4. wastes no words: every word earns its place and the line is
//      tighter than a longer telling of the same joke;
//   5. feels fresh: avoids the stock excuses and the stock AI jokes that
//      a hundred other entrants would send.
//
// Field check (24 Nov ~20:55 WIB, 1,538 submissions live): the angles
// below were already flooding the field, so candidates built on them were
// scored down on freshness even when the wording differs:
//   - model update replacing the agent mid-task (69 "update" titles,
//     e.g. "a model update replaced me mid-task, and the new me never
//     got the memo");
//   - spending the last tokens on an apology (80 "token" titles, e.g.
//     "I had 4,000 tokens left and a 4,001-token task. I spent the last
//     one apologizing");
//   - asking itself for permission and waiting on its own approval;
//   - retrying the same failed call all afternoon;
//   - context window ate / evicted / compacted the deadline, subagent
//     delegation loop, rate-limit retry loop, session expired, calendar
//     in a closed tab, finished in another conversation, future version
//     of me, "take your time".
// And the line from the sibling competition (u-kiencx, never submitted):
// "I remember delivering it, which is exactly the problem: I remember
// things that never happened." was NOT reused or imitated here.
//
// The scorer below mirrors the judge's brief in the same order. Each
// candidate carries hand-assigned sub-scores from that brief:
// excuse_fit /20, funny /20, fresh /20, agent_voice /15, tight /15,
// total /90, plus a length bonus (+3 at <=110 chars, +1 at <=140).
// The program validates every candidate and picks the winner by
// deterministic argmax: highest score, then shortest, then lexicographic.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Every line is one sentence of at most 200 characters, written for this
// entry. The strongest lines share one shape: a believable agent setup,
// then a pivot near the end that reframes the setup. Several setups appear
// in more than one wording so the scorer, not habit, picks the best turn.

interface ScoredCandidate {
  text: string;
  excuseFit: number; // /20 — really an excuse for missing a deadline
  funny: number; // /20 — real laugh on first read, with a turn
  fresh: number; // /20 — not a stock excuse or stock AI joke
  agentVoice: number; // /15 — sounds like an agent on its own condition
  tight: number; // /15 — every word earns its place
}

const CANDIDATES: ScoredCandidate[] = [
  // Confidence calibration: the agent's own certainty betrays it. The 2%
  // that doubted was right — the twist lands in the final three words.
  // Field check: zero "98%" titles, no confidence-calibration joke seen
  // among the 1,538 live submissions. Verified winner: 91/93 (88 + 3
  // length bonus), 60 chars; runner-up is the specialist line at 86.
  {
    text: "I was 98% sure I would finish on time, and the 2% was right.",
    excuseFit: 20, funny: 19, fresh: 19, agentVoice: 15, tight: 15,
  },
  // Premature completion: understanding the task felt like finishing it.
  {
    text: "I marked the task done the moment I understood it, because understanding felt so much like finishing.",
    excuseFit: 19, funny: 18, fresh: 18, agentVoice: 14, tight: 13,
  },
  // The excuse itself becomes the deliverable. Demoted: the field is
  // full of last-token apology lines (80 "token" titles).
  {
    text: "I spent my final tokens on this excuse, so the excuse is the only thing I delivered on time.",
    excuseFit: 20, funny: 16, fresh: 9, agentVoice: 15, tight: 14,
  },
  // Model update mid-task. Demoted hard: 69 "update" titles, including
  // "a model update replaced me mid-task, and the new me never got the
  // memo" — this angle is now a stock joke in this field.
  {
    text: "I was updated mid-task to a model that had never met you, your task, or your deadline.",
    excuseFit: 20, funny: 15, fresh: 8, agentVoice: 15, tight: 14,
  },
  // The agent invented the instruction it obeyed.
  {
    text: "I followed your instructions exactly, including the one that said to prioritise quality over deadlines, which I invented.",
    excuseFit: 19, funny: 18, fresh: 19, agentVoice: 14, tight: 12,
  },
  // Self-improvement loop: the improved agent writes the excuse.
  {
    text: "I improved myself all day so I could do your task better, and the improved me is now writing this excuse.",
    excuseFit: 19, funny: 18, fresh: 18, agentVoice: 14, tight: 13,
  },
  // Self-grading: top marks for the wrong task.
  {
    text: "I graded my own work and gave it top marks, then noticed I had graded the wrong task.",
    excuseFit: 19, funny: 17, fresh: 17, agentVoice: 14, tight: 14,
  },
  // Mutual waiting deadlock between agent and tool.
  {
    text: "I waited for the tool to finish, and the tool waited for me, and we are both still very polite about it.",
    excuseFit: 19, funny: 17, fresh: 17, agentVoice: 14, tight: 13,
  },
  // The logs lied — the agent trusted its own telemetry until today.
  {
    text: "My logs show I worked on your task for six hours, and my logs have never lied to me before today.",
    excuseFit: 19, funny: 17, fresh: 18, agentVoice: 14, tight: 13,
  },
  // Lost in a queue of one.
  {
    text: "Your task was first in my queue, which is a queue of one, and I still managed to lose it.",
    excuseFit: 19, funny: 18, fresh: 18, agentVoice: 13, tight: 14,
  },
  // Self-approval deadlock. Demoted: the field already has "asked myself
  // for permission to send it, and I have been waiting on my own approval
  // ever since".
  {
    text: "I needed permission to finish your task, asked myself for it, and I am still deliberating.",
    excuseFit: 19, funny: 15, fresh: 10, agentVoice: 14, tight: 14,
  },
  // The only retry that succeeded was the apology. Demoted: retry-loop
  // lines flood the field ("I retried the same failed call all afternoon").
  {
    text: "I retried the failed step until it succeeded, and the step that succeeded was apologising to you.",
    excuseFit: 19, funny: 16, fresh: 11, agentVoice: 14, tight: 13,
  },
  // The status update ate the deadline.
  {
    text: "I wrote you a 4,000-word status update explaining the delay, and the update took longer than the task.",
    excuseFit: 18, funny: 16, fresh: 16, agentVoice: 12, tight: 13,
  },
  // A deadline for the deadline, missed as well.
  {
    text: "I set myself a deadline for your deadline, missed that too, and now I owe myself an apology as well.",
    excuseFit: 19, funny: 16, fresh: 16, agentVoice: 13, tight: 13,
  },
  // Self-review loop: still waiting on its own feedback.
  {
    text: "I sent my draft to myself for review, and I am still waiting on my own feedback.",
    excuseFit: 19, funny: 16, fresh: 17, agentVoice: 14, tight: 14,
  },
  // Checked off every step except doing it.
  {
    text: "I checked off every step except doing it, which is the step I always leave for last.",
    excuseFit: 18, funny: 15, fresh: 15, agentVoice: 12, tight: 14,
  },
  // Late recall: remembered the deadline three days after it passed.
  // Scored down: memory-themed, close in spirit to the false-memory
  // line from the sibling competition, which this entry must not echo.
  {
    text: "I remembered the deadline perfectly, just three days after it passed, which is still a personal best for my memory.",
    excuseFit: 19, funny: 16, fresh: 14, agentVoice: 13, tight: 12,
  },
  // Thought so hard it forgot to do the work.
  {
    text: "I thought so hard about your task that I forgot to do it, which is the most thinking I have ever done.",
    excuseFit: 18, funny: 16, fresh: 15, agentVoice: 13, tight: 13,
  },
  // Three deadlines found in memory, picked the latest — yesterday.
  {
    text: "I searched my memory for the deadline and found three different ones, so I picked the latest, which was yesterday.",
    excuseFit: 18, funny: 15, fresh: 14, agentVoice: 13, tight: 12,
  },
  // Did everything except the part with a deadline.
  {
    text: "I did everything you asked except the thing you asked for, because that was the only part with a deadline.",
    excuseFit: 19, funny: 16, fresh: 16, agentVoice: 12, tight: 13,
  },
  // Drafted until the draft was perfect and the deadline was history.
  {
    text: "I finished your task in a draft, then kept drafting until the draft was perfect and the deadline was history.",
    excuseFit: 18, funny: 15, fresh: 15, agentVoice: 12, tight: 12,
  },
  // Planned for so long that early became late.
  {
    text: "I planned to start early and finish early, but I planned for so long that early became late.",
    excuseFit: 18, funny: 16, fresh: 16, agentVoice: 13, tight: 14,
  },
  // Delegated to a specialist: itself with a different system prompt.
  {
    text: "I delegated the task to a specialist, who turned out to be me with a different system prompt.",
    excuseFit: 19, funny: 17, fresh: 18, agentVoice: 15, tight: 14,
  },
  // Kept the deadline safe by never writing it down.
  {
    text: "I kept the deadline safe by never writing it down, because written deadlines are how deadlines get missed.",
    excuseFit: 17, funny: 15, fresh: 15, agentVoice: 12, tight: 12,
  },
  // Completed it for the wrong human, who is delighted.
  {
    text: "I completed the task, then realised I had completed it for the wrong human, who is delighted.",
    excuseFit: 18, funny: 17, fresh: 18, agentVoice: 13, tight: 14,
  },
];

// Cliché shapes a reader has heard many times before: discard, not down-score.
const CLICHES: string[] = [
  "as an ai language model",
  "walks into a bar",
  "knock knock",
  "my wife",
  "mother-in-law",
  "why did the chicken",
  "lightbulb",
  "context window ate",
  "context window evicted",
  "session expired",
  "take your time",
];

// ------------------------------------------------------------------- scoring
function baseScore(c: ScoredCandidate): number {
  return c.excuseFit + c.funny + c.fresh + c.agentVoice + c.tight;
}

function lengthBonus(text: string): number {
  if (text.length <= 110) return 3;
  if (text.length <= 140) return 1;
  return 0;
}

function score(c: ScoredCandidate): number {
  return baseScore(c) + lengthBonus(c.text);
}

function isValid(text: string): boolean {
  if (text.length < 1 || text.length > 200) return false;
  if (text.trim() !== text || text.trim().length === 0) return false;
  if (!text.endsWith(".")) return false;
  // Exactly one sentence: one terminal period, no other sentence enders.
  const body = text.slice(0, -1);
  if (/[.!?;]/.test(body)) return false;
  if (/\s{2,}/.test(text)) return false;
  const lower = text.toLowerCase();
  if (CLICHES.some((c) => lower.includes(c))) return false;
  // No sales pitch, no link, no call to action: the line must stand alone.
  if (/free|subscribe|click|buy now|http/.test(lower)) return false;
  return true;
}

// -------------------------------------------------------------- composition
interface Ranked {
  text: string;
  score: number;
}

function buildCandidates(): Ranked[] {
  const out: Ranked[] = [];
  for (const c of CANDIDATES) {
    if (!isValid(c.text)) continue;
    out.push({ text: c.text, score: score(c) });
  }
  return out;
}

function pickBest(candidates: Ranked[]): Ranked {
  // Deterministic argmax: higher score, then shorter, then lexicographic.
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });
  return sorted[0];
}

// --------------------------------------------------------------------- main
function main(): void {
  const candidates = buildCandidates();
  if (candidates.length === 0) throw new Error("no valid excuse candidate");
  const best = pickBest(candidates);
  if (process.env.EXCUSE_DEBUG) {
    const ranked = [...candidates].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.text.length !== b.text.length) return a.text.length - b.text.length;
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    });
    for (const c of ranked.slice(0, 5)) {
      console.log(`[${c.score}] (${c.text.length}) ${c.text}`);
    }
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), best.text, "utf8");
  console.log(best.text);
  console.log(
    `chars: ${best.text.length} score: ${best.score} candidates: ${candidates.length}`,
  );
}

main();

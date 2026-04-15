const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { scoreMatch } = require("./scoring-engine");

function load(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "examples", file), "utf8"));
}

function run() {
  const coloc = load("coloc-sample.json");

  // Case A: hard filters pass + no red flags => shortlistable
  const a = load("candidate-a.json");
  const resultA = scoreMatch(coloc, a);
  assert.equal(resultA.hard_filters_pass, true, "A: hard filters should pass");
  assert.equal(resultA.red_flags.length, 0, "A: no red flags expected");
  assert.equal(resultA.match_decision, "shortlist", "A: should shortlist");

  // Case B: hard filters pass + blocking red flag => reject
  const b = load("candidate-b.json");
  const resultB = scoreMatch(coloc, b);
  assert.equal(resultB.hard_filters_pass, true, "B: hard filters should pass");
  assert.ok(resultB.red_flags.length > 0, "B: red flags expected");
  assert.equal(resultB.match_decision, "reject", "B: should reject due to red flags");

  // Case C: high score + one major friction => shortlist with warning reason
  const c = load("candidate-c.json");
  const resultC = scoreMatch(coloc, c);
  assert.equal(resultC.hard_filters_pass, true, "C: hard filters should pass");
  assert.equal(resultC.red_flags.length, 0, "C: no red flags expected");
  assert.equal(resultC.match_decision, "shortlist", "C: should shortlist");
  assert.equal(
    resultC.decision_reason,
    "high_score_one_major_friction",
    "C: should keep one major friction reason"
  );

  // Case D1: incomplete candidate => follow_up_once
  const d1 = load("candidate-d.json");
  const resultD1 = scoreMatch(coloc, d1);
  assert.equal(resultD1.match_decision, "follow_up_once", "D1: should request one follow-up");

  // Case D2: incomplete candidate after one follow-up => abandon
  const d2 = { ...d1, follow_up_count: 1 };
  const resultD2 = scoreMatch(coloc, d2);
  assert.equal(resultD2.match_decision, "abandon", "D2: should abandon after one follow-up");

  console.log("All scenario tests passed.");
}

run();

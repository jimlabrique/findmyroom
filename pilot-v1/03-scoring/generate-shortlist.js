const fs = require("fs");
const path = require("path");
const { scoreMatch } = require("./scoring-engine");

function parseArgs(argv) {
  const args = { candidates: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--coloc") args.coloc = argv[++i];
    else if (token === "--candidate") args.candidates.push(argv[++i]);
    else if (token === "--top") args.top = Number(argv[++i]);
    else if (token === "--out") args.out = argv[++i];
  }

  if (!args.coloc) throw new Error("Missing --coloc <file>");
  if (!args.candidates.length) throw new Error("Use at least one --candidate <file>");

  args.top = Number.isFinite(args.top) && args.top > 0 ? args.top : 3;
  args.out = args.out || null;
  return args;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
}

function recommendationFromDecision(result) {
  if (result.match_decision === "shortlist") {
    if (result.compat_score >= 80) return "strong fit";
    return "fit with caution";
  }
  return "not recommended";
}

function renderMarkdown(coloc, rows, topN) {
  const rentTotal = Number(coloc.monthly_rent_eur || 0) + Number(coloc.charges_eur || 0);
  const shortlistRows = rows
    .filter((r) => r.result.match_decision === "shortlist")
    .sort((a, b) => (b.result.compat_score || 0) - (a.result.compat_score || 0))
    .slice(0, topN);

  const allRows = rows.sort((a, b) => {
    const sa = a.result.compat_score === null ? -1 : a.result.compat_score;
    const sb = b.result.compat_score === null ? -1 : b.result.compat_score;
    return sb - sa;
  });

  const header = [
    `# Shortlist Recap - ${coloc.room_title || "Room"}`,
    "",
    "## Coloc summary",
    "",
    `- Quartier: ${coloc.district || "-"}`,
    `- Loyer total: ${rentTotal} EUR`,
    `- Date dispo: ${coloc.room_available_date || "-"}`,
    `- Segment accepte: ${coloc.accepted_segment || "-"}`,
    ""
  ];

  const shortlistTable = [
    "## Shortlist candidates",
    "",
    "| Candidate | Score | 3 alignements | 2 frictions | Recommendation |",
    "|---|---:|---|---|---|"
  ];

  if (!shortlistRows.length) {
    shortlistTable.push("| - | - | No shortlist generated | - | - |");
  } else {
    shortlistRows.forEach((row) => {
      shortlistTable.push(
        `| ${row.candidate.full_name || "Unknown"} | ${row.result.compat_score} | ${row.result.explain_top_matches} | ${row.result.explain_top_frictions} | ${recommendationFromDecision(row.result)} |`
      );
    });
  }

  const decisionTable = [
    "",
    "## Full decision board",
    "",
    "| Candidate | Decision | Reason | Hard filters | Red flags | Score |",
    "|---|---|---|---|---|---:|"
  ];

  allRows.forEach((row) => {
    decisionTable.push(
      `| ${row.candidate.full_name || "Unknown"} | ${row.result.match_decision} | ${row.result.decision_reason} | ${row.result.hard_filters_pass} | ${row.result.red_flags.join(", ") || "-"} | ${row.result.compat_score === null ? "-" : row.result.compat_score} |`
    );
  });

  return [...header, ...shortlistTable, ...decisionTable, ""].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const coloc = loadJson(args.coloc);

  const rows = args.candidates.map((candidatePath) => {
    const candidate = loadJson(candidatePath);
    return {
      candidate,
      result: scoreMatch(coloc, candidate)
    };
  });

  const markdown = renderMarkdown(coloc, rows, args.top);

  if (args.out) {
    fs.writeFileSync(path.resolve(args.out), markdown, "utf8");
    console.log(`Shortlist written to ${path.resolve(args.out)}`);
  } else {
    console.log(markdown);
  }
}

if (require.main === module) {
  main();
}

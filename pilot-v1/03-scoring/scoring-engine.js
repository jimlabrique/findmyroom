const fs = require("fs");
const path = require("path");

function loadRubric() {
  const rubricPath = path.join(__dirname, "scoring-rubric.json");
  return JSON.parse(fs.readFileSync(rubricPath, "utf8"));
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayDiff(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.floor((a.getTime() - b.getTime()) / ms);
}

function normalizeScale(value, min, max) {
  if (typeof value !== "number") return null;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function compatibilityFromDistance(a, b, maxDistance) {
  if (a === null || b === null) return null;
  const dist = Math.abs(a - b);
  const raw = 100 - (dist / maxDistance) * 100;
  return Math.max(0, Math.min(100, raw));
}

function hasValue(v) {
  return v !== null && v !== undefined && v !== "";
}

function validateRequiredFields(candidate) {
  const required = [
    "full_name",
    "whatsapp",
    "segment",
    "budget_max_eur",
    "preferred_districts",
    "move_in_date",
    "target_stay_months",
    "lifestyle_cleanliness",
    "lifestyle_noise",
    "lifestyle_sociability",
    "lifestyle_guests",
    "lifestyle_schedule",
    "lifestyle_remote_work",
    "smoker",
    "has_pet",
    "consent_rgpd"
  ];

  const missing = required.filter((k) => !hasValue(candidate[k]));

  return {
    complete: missing.length === 0,
    missing
  };
}

function evaluateHardFilters(coloc, candidate, rubric) {
  const details = [];
  let pass = true;

  const rent = Number(coloc.monthly_rent_eur || 0) + Number(coloc.charges_eur || 0);
  const budget = Number(candidate.budget_max_eur || 0);
  if (budget < rent) {
    pass = false;
    details.push("budget_below_rent");
  }

  const available = toDate(coloc.room_available_date);
  const requested = toDate(candidate.move_in_date);
  if (!available || !requested) {
    pass = false;
    details.push("invalid_move_in_dates");
  } else {
    const deltaDays = dayDiff(requested, available);
    if (deltaDays < 0 || deltaDays > rubric.hardFilters.maxMoveInDelayDays) {
      pass = false;
      details.push("move_in_outside_window");
    }
  }

  const acceptedSegment = coloc.accepted_segment;
  if (acceptedSegment !== "both" && acceptedSegment !== candidate.segment) {
    pass = false;
    details.push("segment_not_allowed");
  }

  if (rubric.hardFilters.requireDistrictOverlap) {
    const preferred = Array.isArray(candidate.preferred_districts) ? candidate.preferred_districts : [];
    if (!preferred.includes(coloc.district)) {
      pass = false;
      details.push("district_no_overlap");
    }
  }

  return { pass, details };
}

function detectRedFlags(coloc, candidate) {
  const flags = [];
  const nonNegotiables = Array.isArray(coloc.non_negotiables) ? coloc.non_negotiables : [];

  const candidateSmoker = candidate.smoker === "yes" || candidate.smoker === "occasionally";
  const candidateHasPet = Boolean(candidate.has_pet);

  if (nonNegotiables.includes("no_smoking") && candidateSmoker) {
    flags.push("candidate_smoker_vs_no_smoking_rule");
  }
  if (nonNegotiables.includes("no_pets") && candidateHasPet) {
    flags.push("candidate_pet_vs_no_pets_rule");
  }
  if (nonNegotiables.includes("quiet_after_22") && Number(candidate.lifestyle_noise) >= 4) {
    flags.push("high_noise_vs_quiet_rule");
  }
  if (nonNegotiables.includes("no_party") && Number(candidate.lifestyle_guests) >= 4) {
    flags.push("frequent_guests_vs_no_party_rule");
  }
  if (nonNegotiables.includes("cleaning_strict") && Number(candidate.lifestyle_cleanliness) <= 2) {
    flags.push("low_cleanliness_vs_strict_cleaning_rule");
  }

  if (coloc.smoking_allowed === "no" && candidateSmoker) {
    flags.push("smoking_policy_conflict");
  }
  if (coloc.pets_allowed === "no" && candidateHasPet) {
    flags.push("pet_policy_conflict");
  }
  if (coloc.pets_allowed === "cat_only" && candidateHasPet && (candidate.pet_type || "").toLowerCase() !== "cat") {
    flags.push("pet_type_conflict");
  }

  return flags;
}

function computeDimensionScores(coloc, candidate) {
  const scores = {};

  scores.lifestyle_cleanliness = compatibilityFromDistance(
    normalizeScale(Number(coloc.lifestyle_cleanliness), 1, 5),
    normalizeScale(Number(candidate.lifestyle_cleanliness), 1, 5),
    4
  );
  scores.lifestyle_noise = compatibilityFromDistance(
    normalizeScale(Number(coloc.lifestyle_noise), 1, 5),
    normalizeScale(Number(candidate.lifestyle_noise), 1, 5),
    4
  );
  scores.lifestyle_sociability = compatibilityFromDistance(
    normalizeScale(Number(coloc.lifestyle_sociability), 1, 5),
    normalizeScale(Number(candidate.lifestyle_sociability), 1, 5),
    4
  );
  scores.lifestyle_guests = compatibilityFromDistance(
    normalizeScale(Number(coloc.lifestyle_guests), 1, 5),
    normalizeScale(Number(candidate.lifestyle_guests), 1, 5),
    4
  );
  scores.lifestyle_schedule = compatibilityFromDistance(
    normalizeScale(Number(coloc.lifestyle_schedule), 1, 5),
    normalizeScale(Number(candidate.lifestyle_schedule), 1, 5),
    4
  );
  scores.lifestyle_remote_work = compatibilityFromDistance(
    normalizeScale(Number(coloc.lifestyle_remote_work), 0, 5),
    normalizeScale(Number(candidate.lifestyle_remote_work), 0, 5),
    5
  );

  const candidateSmoker = candidate.smoker === "yes" || candidate.smoker === "occasionally";
  if (coloc.smoking_allowed === "yes") {
    scores.smoking_fit = 100;
  } else if (coloc.smoking_allowed === "outside_only") {
    scores.smoking_fit = candidateSmoker ? 70 : 100;
  } else {
    scores.smoking_fit = candidateSmoker ? 0 : 100;
  }

  const hasPet = Boolean(candidate.has_pet);
  if (coloc.pets_allowed === "all") {
    scores.pets_fit = 100;
  } else if (coloc.pets_allowed === "small_pets") {
    scores.pets_fit = hasPet ? 70 : 100;
  } else if (coloc.pets_allowed === "cat_only") {
    if (!hasPet) {
      scores.pets_fit = 100;
    } else {
      const petType = (candidate.pet_type || "").toLowerCase();
      scores.pets_fit = petType === "cat" ? 100 : 0;
    }
  } else {
    scores.pets_fit = hasPet ? 0 : 100;
  }

  return scores;
}

function computeWeightedScore(dimensionScores, weights) {
  const weightSum = Object.values(weights).reduce((acc, w) => acc + w, 0);
  if (weightSum <= 0) return 0;

  let weighted = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const value = typeof dimensionScores[key] === "number" ? dimensionScores[key] : 0;
    weighted += value * weight;
  }
  return Math.round(weighted / weightSum);
}

function computeMajorFrictions(coloc, candidate, rubric) {
  const fields = Object.keys(rubric.majorFrictionThresholdByDimension);
  const frictions = [];

  for (const key of fields) {
    const threshold = rubric.majorFrictionThresholdByDimension[key];
    const colocValue = Number(coloc[key]);
    const candidateValue = Number(candidate[key]);
    if (!Number.isFinite(colocValue) || !Number.isFinite(candidateValue)) continue;
    const delta = Math.abs(colocValue - candidateValue);
    if (delta >= threshold) {
      frictions.push(`${key}_delta_${delta}`);
    }
  }
  return frictions;
}

function labelForDimension(key) {
  const labels = {
    lifestyle_cleanliness: "menage",
    lifestyle_noise: "niveau de bruit",
    lifestyle_sociability: "sociabilite",
    lifestyle_guests: "frequence invites",
    lifestyle_schedule: "rythme quotidien",
    lifestyle_remote_work: "teletravail",
    smoking_fit: "compatibilite tabac",
    pets_fit: "compatibilite animaux"
  };
  return labels[key] || key;
}

function buildExplanations(dimensionScores) {
  const entries = Object.entries(dimensionScores)
    .filter(([, v]) => typeof v === "number")
    .sort((a, b) => b[1] - a[1]);

  const topMatches = entries.slice(0, 3).map(([k, v]) => `${labelForDimension(k)} (${Math.round(v)}%)`);
  const topFrictions = [...entries].reverse().slice(0, 2).map(([k, v]) => `${labelForDimension(k)} (${Math.round(v)}%)`);

  return {
    explain_top_matches: topMatches.join(", "),
    explain_top_frictions: topFrictions.join(", ")
  };
}

function decideMatch({
  candidateValidation,
  hardFilters,
  redFlags,
  compatScore,
  majorFrictions,
  rubric,
  followUpCount
}) {
  if (!candidateValidation.complete) {
    if ((followUpCount || 0) >= 1) {
      return {
        match_decision: "abandon",
        decision_reason: "candidate_incomplete_after_follow_up"
      };
    }
    return {
      match_decision: "follow_up_once",
      decision_reason: "candidate_incomplete_missing_fields"
    };
  }

  if (!hardFilters.pass) {
    return {
      match_decision: "reject",
      decision_reason: "hard_filters_failed"
    };
  }

  if (redFlags.length > 0) {
    return {
      match_decision: "reject",
      decision_reason: "red_flags_blocking"
    };
  }

  if (compatScore >= rubric.scoreBands.shortlistMin) {
    if (majorFrictions.length <= 1) {
      return {
        match_decision: "shortlist",
        decision_reason: majorFrictions.length === 1 ? "high_score_one_major_friction" : "high_score"
      };
    }
    return {
      match_decision: "reject",
      decision_reason: "high_score_but_too_many_major_frictions"
    };
  }

  if (compatScore >= rubric.scoreBands.conditionalShortlistMin && majorFrictions.length === 0) {
    return {
      match_decision: "shortlist",
      decision_reason: "conditional_shortlist_medium_score_no_major_friction"
    };
  }

  return {
    match_decision: "reject",
    decision_reason: "score_too_low"
  };
}

function scoreMatch(coloc, candidate, rubricInput) {
  const rubric = rubricInput || loadRubric();
  const candidateValidation = validateRequiredFields(candidate);
  const hardFilters = evaluateHardFilters(coloc, candidate, rubric);
  const redFlags = detectRedFlags(coloc, candidate);

  const dimensionScores = computeDimensionScores(coloc, candidate);
  const compatScore = hardFilters.pass ? computeWeightedScore(dimensionScores, rubric.weights) : null;
  const majorFrictions = computeMajorFrictions(coloc, candidate, rubric);
  const explanations = buildExplanations(dimensionScores);

  const decision = decideMatch({
    candidateValidation,
    hardFilters,
    redFlags,
    compatScore: compatScore || 0,
    majorFrictions,
    rubric,
    followUpCount: Number(candidate.follow_up_count || 0)
  });

  return {
    hard_filters_pass: hardFilters.pass,
    hard_filter_details: hardFilters.details,
    red_flags: redFlags,
    major_friction_count: majorFrictions.length,
    major_frictions: majorFrictions,
    compat_score: compatScore,
    explain_top_matches: explanations.explain_top_matches,
    explain_top_frictions: explanations.explain_top_frictions,
    candidate_missing_fields: candidateValidation.missing,
    match_decision: decision.match_decision,
    decision_reason: decision.decision_reason
  };
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const args = process.argv.slice(2);
  const colocArgIndex = args.indexOf("--coloc");
  const candidateArgIndex = args.indexOf("--candidate");

  if (colocArgIndex === -1 || candidateArgIndex === -1) {
    console.log("Usage: node scoring-engine.js --coloc <coloc.json> --candidate <candidate.json>");
    process.exit(1);
  }

  const colocPath = args[colocArgIndex + 1];
  const candidatePath = args[candidateArgIndex + 1];
  if (!colocPath || !candidatePath) {
    console.error("Missing file path for --coloc or --candidate");
    process.exit(1);
  }

  const coloc = loadJson(path.resolve(colocPath));
  const candidate = loadJson(path.resolve(candidatePath));
  const result = scoreMatch(coloc, candidate);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  loadRubric,
  scoreMatch,
  validateRequiredFields,
  evaluateHardFilters,
  detectRedFlags,
  computeDimensionScores,
  computeWeightedScore,
  computeMajorFrictions
};

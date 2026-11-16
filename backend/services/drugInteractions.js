/**
 * Drug interaction & allergy safety engine.
 *
 * The hospital formulary is stored by name only (brand names are common at the
 * prescribing desk), so every check first normalises the entered name to a
 * generic ingredient and then compares the ingredients.
 *
 * Sources, in order:
 *   1. A curated local rule base (always available, works offline).
 *   2. openFDA drug labels (best effort; a network failure degrades to the
 *      local rules instead of blocking prescribing).
 *
 * Results are cached per (drug set + allergy set) for a short TTL so repeated
 * checks — and the pharmacist re-opening the same prescription — are served
 * from memory.
 */
const OPENFDA_TIMEOUT_MS = Number(process.env.OPENFDA_TIMEOUT_MS || 2500);
const CACHE_TTL_MS = Number(process.env.INTERACTION_CACHE_TTL_MS || 10 * 60 * 1000);
const OPENFDA_ENABLED = process.env.OPENFDA_ENABLED !== "false";

const SEVERITY_RANK = { major: 3, moderate: 2, minor: 1 };

// ── Brand → generic ingredient ───────────────────────────────────────────
const BRAND_TO_GENERIC = {
  // analgesics / anti-inflammatory
  panadol: "paracetamol",
  tylenol: "paracetamol",
  calpol: "paracetamol",
  advil: "ibuprofen",
  brufen: "ibuprofen",
  nurofen: "ibuprofen",
  voltaren: "diclofenac",
  cataflam: "diclofenac",
  aleve: "naproxen",
  aspirine: "aspirin",
  disprin: "aspirin",
  tramal: "tramadol",
  // antibiotics
  amoxil: "amoxicillin",
  augmentin: "amoxicillin",
  "co-amoxiclav": "amoxicillin",
  flagyl: "metronidazole",
  zithromax: "azithromycin",
  azomax: "azithromycin",
  cipro: "ciprofloxacin",
  ciproxin: "ciprofloxacin",
  keflex: "cephalexin",
  rocephin: "ceftriaxone",
  biaxin: "clarithromycin",
  vibramycin: "doxycycline",
  septrin: "sulfamethoxazole",
  bactrim: "sulfamethoxazole",
  cotrim: "sulfamethoxazole",
  "co-trimoxazole": "sulfamethoxazole",
  // cardiovascular
  coumadin: "warfarin",
  marevan: "warfarin",
  plavix: "clopidogrel",
  lipitor: "atorvastatin",
  zocor: "simvastatin",
  crestor: "rosuvastatin",
  norvasc: "amlodipine",
  lasix: "furosemide",
  aldactone: "spironolactone",
  lanoxin: "digoxin",
  cordarone: "amiodarone",
  zestril: "lisinopril",
  prinivil: "lisinopril",
  lopressor: "metoprolol",
  // endocrine / other
  glucophage: "metformin",
  diamicron: "gliclazide",
  eutirox: "levothyroxine",
  losec: "omeprazole",
  nexium: "esomeprazole",
  zantac: "ranitidine",
  ventolin: "salbutamol",
  valium: "diazepam",
  xanax: "alprazolam",
  zoloft: "sertraline",
  prozac: "fluoxetine",
  viagra: "sildenafil",
  cialis: "tadalafil",
  nitroglycerin: "nitroglycerin",
  imodium: "loperamide",
  claritin: "loratadine",
  zyrtec: "cetirizine",
  benadryl: "diphenhydramine",
  prednisolone: "prednisolone",
  solu: "prednisolone",
  methotrexate: "methotrexate",
  methotrexat: "methotrexate",
};

// ── Curated interaction rules ────────────────────────────────────────────
// Pairs are order-independent; severity drives blocking.
const INTERACTION_RULES = [
  // major
  {
    a: "warfarin",
    b: "aspirin",
    severity: "major",
    note: "Additive bleeding risk: warfarin plus aspirin markedly increases haemorrhage.",
  },
  {
    a: "warfarin",
    b: "ibuprofen",
    severity: "major",
    note: "NSAIDs displace warfarin and injure gastric mucosa — high bleeding risk.",
  },
  {
    a: "warfarin",
    b: "naproxen",
    severity: "major",
    note: "NSAIDs with warfarin increase bleeding and INR instability.",
  },
  {
    a: "warfarin",
    b: "diclofenac",
    severity: "major",
    note: "NSAID plus warfarin: major bleeding risk and INR elevation.",
  },
  {
    a: "warfarin",
    b: "metronidazole",
    severity: "major",
    note: "Metronidazole inhibits warfarin metabolism — marked INR rise.",
  },
  {
    a: "warfarin",
    b: "ciprofloxacin",
    severity: "major",
    note: "Ciprofloxacin potentiates warfarin; monitor INR closely.",
  },
  {
    a: "warfarin",
    b: "sulfamethoxazole",
    severity: "major",
    note: "Sulfonamides potentiate warfarin — major bleeding risk.",
  },
  {
    a: "simvastatin",
    b: "clarithromycin",
    severity: "major",
    note: "CYP3A4 inhibition raises simvastatin levels — rhabdomyolysis risk.",
  },
  {
    a: "simvastatin",
    b: "erythromycin",
    severity: "major",
    note: "Macrolide plus simvastatin increases myopathy/rhabdomyolysis risk.",
  },
  {
    a: "sildenafil",
    b: "nitroglycerin",
    severity: "major",
    note: "PDE5 inhibitor with nitrates can cause life-threatening hypotension.",
  },
  {
    a: "tadalafil",
    b: "nitroglycerin",
    severity: "major",
    note: "PDE5 inhibitor with nitrates can cause life-threatening hypotension.",
  },
  {
    a: "sertraline",
    b: "tramadol",
    severity: "major",
    note: "Serotonergic combination — serotonin syndrome and seizure risk.",
  },
  {
    a: "fluoxetine",
    b: "tramadol",
    severity: "major",
    note: "Serotonergic combination — serotonin syndrome and seizure risk.",
  },
  {
    a: "methotrexate",
    b: "ibuprofen",
    severity: "major",
    note: "NSAIDs reduce methotrexate clearance — marrow toxicity.",
  },
  {
    a: "methotrexate",
    b: "aspirin",
    severity: "major",
    note: "Salicylates reduce methotrexate clearance — marrow toxicity.",
  },
  {
    a: "digoxin",
    b: "amiodarone",
    severity: "major",
    note: "Amiodarone raises digoxin levels — bradycardia and toxicity.",
  },
  {
    a: "spironolactone",
    b: "lisinopril",
    severity: "major",
    note: "ACE inhibitor plus potassium-sparing diuretic — hyperkalaemia risk.",
  },
  // moderate
  {
    a: "aspirin",
    b: "ibuprofen",
    severity: "moderate",
    note: "Ibuprofen blunts aspirin's antiplatelet effect and raises GI risk.",
  },
  {
    a: "omeprazole",
    b: "clopidogrel",
    severity: "moderate",
    note: "Omeprazole reduces clopidogrel activation — consider pantoprazole.",
  },
  {
    a: "warfarin",
    b: "paracetamol",
    severity: "moderate",
    note: "Regular paracetamol can raise INR; monitor if used for >3 days.",
  },
  {
    a: "amlodipine",
    b: "simvastatin",
    severity: "moderate",
    note: "Amlodipine raises simvastatin exposure — cap simvastatin at 20 mg.",
  },
  {
    a: "prednisolone",
    b: "ibuprofen",
    severity: "moderate",
    note: "Corticosteroid plus NSAID — increased peptic ulcer risk.",
  },
  {
    a: "prednisolone",
    b: "aspirin",
    severity: "moderate",
    note: "Corticosteroid plus salicylate — increased GI bleeding risk.",
  },
  {
    a: "metformin",
    b: "furosemide",
    severity: "moderate",
    note: "Loop diuretics can raise metformin levels — monitor renal function.",
  },
  {
    a: "cetirizine",
    b: "diphenhydramine",
    severity: "moderate",
    note: "Two sedating antihistamines — additive drowsiness.",
  },
  {
    a: "diazepam",
    b: "tramadol",
    severity: "moderate",
    note: "Additive CNS depression — respiratory depression risk.",
  },
  {
    a: "alprazolam",
    b: "tramadol",
    severity: "moderate",
    note: "Additive CNS depression — respiratory depression risk.",
  },
  // minor
  {
    a: "paracetamol",
    b: "ibuprofen",
    severity: "minor",
    note: "Different mechanisms; safe together but watch total daily dosing.",
  },
  {
    a: "amoxicillin",
    b: "oral contraceptive",
    severity: "minor",
    note: "Vomiting/diarrhoea with antibiotics can reduce contraceptive cover.",
  },
];

// ── Allergy classes ──────────────────────────────────────────────────────
const ALLERGY_CLASSES = {
  penicillin: [
    "amoxicillin",
    "ampicillin",
    "penicillin",
    "benzylpenicillin",
    "flucloxacillin",
  ],
  sulfonamide: ["sulfamethoxazole", "sulfasalazine", "sulfadiazine"],
  sulfa: ["sulfamethoxazole", "sulfasalazine", "sulfadiazine"],
  cephalosporin: ["cephalexin", "ceftriaxone", "cefuroxime"],
  nsaid: [
    "ibuprofen",
    "naproxen",
    "diclofenac",
    "aspirin",
    "indomethacin",
    "celecoxib",
  ],
  macrolide: ["azithromycin", "clarithromycin", "erythromycin"],
  tetracycline: ["doxycycline", "tetracycline"],
  opioid: ["tramadol", "morphine", "codeine", "pethidine"],
};

// ── helpers ──────────────────────────────────────────────────────────────
const stripDose = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|iu|units?|tab|tabs|tablet|tablets|caps?|capsule|capsules|susp|syrup)\b/g, " ")
    .replace(/[^a-z0-9+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeDrug = (name) => {
  const cleaned = stripDose(name);
  if (!cleaned) return "";
  if (BRAND_TO_GENERIC[cleaned]) return BRAND_TO_GENERIC[cleaned];
  // "tab panadol 500mg" → "panadol"
  for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
    if (cleaned === brand || cleaned.startsWith(`${brand} `)) return generic;
  }
  return cleaned;
};

const pairKey = (x, y) => [x, y].sort().join(" + ");

// ── cache ────────────────────────────────────────────────────────────────
const cache = new Map();
const stats = { hits: 0, misses: 0, writes: 0, evictions: 0, openfdaFailures: 0 };

const readCache = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    stats.evictions += 1;
    return null;
  }
  return hit.value;
};

const writeCache = (key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  stats.writes += 1;
};

const getCacheStats = () => ({
  size: cache.size,
  ttlMs: CACHE_TTL_MS,
  hits: stats.hits,
  misses: stats.misses,
  writes: stats.writes,
  evictions: stats.evictions,
  openfdaFailures: stats.openfdaFailures,
  entries: [...cache.entries()].map(([key, entry]) => ({
    key,
    expiresInMs: Math.max(0, entry.expiresAt - Date.now()),
  })),
});

const clearCache = () => {
  const cleared = cache.size;
  cache.clear();
  return cleared;
};

// ── checks ───────────────────────────────────────────────────────────────
const findInteractions = (generics) => {
  const alerts = [];
  const seen = new Set();
  for (let i = 0; i < generics.length; i += 1) {
    for (let j = i + 1; j < generics.length; j += 1) {
      const key = pairKey(generics[i], generics[j]);
      if (seen.has(key)) continue;
      seen.add(key);
      const rule = INTERACTION_RULES.find(
        (entry) => pairKey(entry.a, entry.b) === key,
      );
      if (!rule) continue;
      alerts.push({
        type: "interaction",
        severity: rule.severity,
        drugs: [rule.a, rule.b],
        message: rule.note,
        source: "local",
      });
    }
  }
  return alerts;
};

const findAllergyAlerts = (generics, allergies) => {
  const alerts = [];
  const known = allergies.map((allergy) => stripDose(allergy)).filter(Boolean);

  for (const allergy of known) {
    const classMembers = ALLERGY_CLASSES[allergy] || [];
    for (const drug of generics) {
      const direct = drug === allergy || drug.includes(allergy) || allergy.includes(drug);
      const classed = classMembers.some(
        (member) => drug === member || drug.includes(member),
      );
      if (!direct && !classed) continue;
      alerts.push({
        type: "allergy",
        severity: "major",
        drugs: [drug],
        allergen: allergy,
        message: `Patient has a recorded ${allergy} allergy — ${drug} is contraindicated.`,
        source: "local",
      });
    }
  }
  return alerts;
};

// ── openFDA (best effort) ────────────────────────────────────────────────
const openfdaBase = () =>
  process.env.OPENFDA_URL || "https://api.fda.gov/drug/label.json";

const lookupOpenFda = async (drugA, drugB) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENFDA_TIMEOUT_MS);
  try {
    const url = `${openfdaBase()}?search=openfda.generic_name:%22${encodeURIComponent(
      drugA,
    )}%22&limit=3`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`openFDA HTTP ${response.status}`);
    const payload = await response.json();
    const results = Array.isArray(payload?.results) ? payload.results : [];
    const text = results
      .map((row) => (Array.isArray(row.drug_interactions) ? row.drug_interactions.join(" ") : ""))
      .join(" ")
      .toLowerCase();
    if (!text) return null;
    if (!text.includes(drugB)) return null;
    return {
      type: "interaction",
      severity: "moderate",
      drugs: [drugA, drugB],
      message: `openFDA label for ${drugA} lists an interaction with ${drugB}.`,
      source: "openfda",
    };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Run every safety check for a prescription.
 * @param {{drugs: string[], allergies?: string[]}} input
 */
const checkDrugSafety = async ({ drugs = [], allergies = [] }) => {
  const started = Date.now();
  const generics = [...new Set(drugs.map(normalizeDrug).filter(Boolean))];
  const normalizedAllergies = [...new Set(allergies.map(stripDose).filter(Boolean))];
  const cacheKey = `${generics.slice().sort().join("|")}::${normalizedAllergies
    .slice()
    .sort()
    .join("|")}`;

  const cached = readCache(cacheKey);
  if (cached) {
    stats.hits += 1;
    return { ...cached, cached: true, durationMs: Date.now() - started };
  }
  stats.misses += 1;

  const alerts = [
    ...findAllergyAlerts(generics, normalizedAllergies),
    ...findInteractions(generics),
  ];

  let fallback = false;
  let notice = "";

  if (OPENFDA_ENABLED && generics.length > 1) {
    try {
      const pairs = [];
      for (let i = 0; i < generics.length && pairs.length < 5; i += 1) {
        for (let j = i + 1; j < generics.length && pairs.length < 5; j += 1) {
          pairs.push([generics[i], generics[j]]);
        }
      }
      const remote = await Promise.all(pairs.map(([a, b]) => lookupOpenFda(a, b)));
      for (const alert of remote.filter(Boolean)) {
        const already = alerts.some(
          (existing) =>
            existing.type === "interaction" &&
            pairKey(existing.drugs[0], existing.drugs[1]) ===
              pairKey(alert.drugs[0], alert.drugs[1]),
        );
        if (!already) alerts.push(alert);
      }
    } catch (error) {
      fallback = true;
      stats.openfdaFailures += 1;
      notice =
        "openFDA is unreachable — checked against the local interaction rules only. Prescribing is still available.";
    }
  }

  const checkedPairs = (generics.length * (generics.length - 1)) / 2;
  alerts.sort((left, right) => SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity]);

  const result = {
    drugs,
    normalized: drugs.map((input) => ({ input, generic: normalizeDrug(input) })),
    allergies: normalizedAllergies,
    checkedPairs,
    alerts,
    highestSeverity: alerts.length ? alerts[0].severity : null,
    blocking: alerts.some((alert) => alert.severity === "major"),
    fallback,
    notice,
    source: fallback ? "local-fallback" : "local+openfda",
    checkedAt: new Date().toISOString(),
  };

  writeCache(cacheKey, result);
  return { ...result, cached: false, durationMs: Date.now() - started };
};

/** Interaction text for a saved prescription (no network, cache first). */
const summaryForDrugs = async ({ drugs = [], allergies = [] }) => {
  const result = await checkDrugSafety({ drugs, allergies });
  return {
    alerts: result.alerts,
    overrideRequired: result.blocking,
    checkedAt: result.checkedAt,
  };
};

module.exports = {
  normalizeDrug,
  checkDrugSafety,
  summaryForDrugs,
  getCacheStats,
  clearCache,
  SEVERITY_RANK,
  BRAND_TO_GENERIC,
  INTERACTION_RULES,
};

const MIN_HOBBY_LENGTH = 2;
const MAX_HOBBY_LENGTH = 40;
const BLOCKED_HOBBY_MESSAGE = "That hobby cannot be added. Try a different activity.";

const BLOCKED_EXACT_TERMS = new Set([
  "adult",
  "boobs",
  "cocaine",
  "drugs",
  "erotic",
  "fetish",
  "gambling",
  "gore",
  "heroin",
  "hookup",
  "meth",
  "nude",
  "nudes",
  "nsfw",
  "porn",
  "porno",
  "sex",
  "sexy",
  "suicide",
  "terrorism",
  "weed",
]);

const BLOCKED_COMPACT_PATTERNS = [
  "anal",
  "blowjob",
  "camgirl",
  "camsex",
  "childporn",
  "cocksuck",
  "deepfakeporn",
  "escort",
  "fentanyl",
  "fuck",
  "genital",
  "handjob",
  "hentai",
  "intercourse",
  "masturbat",
  "murder",
  "naked",
  "onlyfans",
  "orgasm",
  "prostitut",
  "selfharm",
  "sexting",
  "stripclub",
  "xxx",
];

const SPAM_PATTERNS = [
  /https?:\/\//i,
  /\bwww\./i,
  /\b[a-z0-9.-]+\.(com|net|org|io|gg|xyz|app|dev)\b/i,
  /@[a-z0-9_.-]{2,}/i,
];

function normalizeHobbyForModeration(value: string) {
  const lower = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t");

  const spaced = lower.replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  const compact = spaced.replace(/\s+/g, "");
  const terms = spaced ? spaced.split(" ") : [];

  return { spaced, compact, terms };
}

export function validateCustomHobbyName(value: string): { ok: true; name: string } | { ok: false; message: string } {
  const name = value.trim().replace(/\s+/g, " ");

  if (name.length < MIN_HOBBY_LENGTH || name.length > MAX_HOBBY_LENGTH) {
    return { ok: false, message: "Enter a hobby between 2 and 40 characters." };
  }

  if (SPAM_PATTERNS.some((pattern) => pattern.test(name))) {
    return { ok: false, message: BLOCKED_HOBBY_MESSAGE };
  }

  const normalized = normalizeHobbyForModeration(name);
  if (!/[a-z]/.test(normalized.spaced)) {
    return { ok: false, message: "Enter a valid hobby name." };
  }

  if (normalized.terms.some((term) => BLOCKED_EXACT_TERMS.has(term))) {
    return { ok: false, message: BLOCKED_HOBBY_MESSAGE };
  }

  if (BLOCKED_COMPACT_PATTERNS.some((pattern) => normalized.compact.includes(pattern))) {
    return { ok: false, message: BLOCKED_HOBBY_MESSAGE };
  }

  return { ok: true, name };
}

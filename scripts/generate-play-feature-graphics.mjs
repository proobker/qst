import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outputDir = process.argv[2] ?? "play-store-feature-graphics";

const W = 1024;
const H = 500;

const colors = {
  bg: "#0f172a",
  bg2: "#111827",
  surface: "#1e293b",
  surface2: "#243247",
  border: "#40506a",
  muted: "#a7b2c3",
  white: "#f8fafc",
  primary: "#8b5cf6",
  primary2: "#a855f7",
  darkPurple: "#301264",
  accent: "#f59e0b",
  success: "#10b981",
  red: "#f87171",
};

const graphics = [
  {
    file: "qst-feature-01-real-life-rpg.png",
    titleLines: ["Real life is", "the game"],
    subtitleLines: ["Discover quests around your hobbies,", "location, and friends."],
    tag: "qst",
    scene: "map",
  },
  {
    file: "qst-feature-02-ai-quests.png",
    titleLines: ["AI-generated", "quests"],
    subtitleLines: ["Fresh side quests built for", "what you actually like to do."],
    tag: "AI QUESTS",
    scene: "cards",
  },
  {
    file: "qst-feature-03-proof-upload.png",
    titleLines: ["Complete quests", "with proof"],
    subtitleLines: ["Upload a photo, post your win,", "and keep the adventure moving."],
    tag: "PHOTO PROOF",
    scene: "proof",
  },
  {
    file: "qst-feature-04-friend-approval.png",
    titleLines: ["Friends approve", "your wins"],
    subtitleLines: ["Your crew votes on completions", "before rewards unlock."],
    tag: "SOCIAL RPG",
    scene: "friends",
  },
  {
    file: "qst-feature-05-level-up.png",
    titleLines: ["Earn XP", "and badges"],
    subtitleLines: ["Level up by turning ordinary", "days into adventures."],
    tag: "LEVEL UP",
    scene: "rewards",
  },
];

function esc(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function qstLogo(x, y, scale = 1) {
  const fs = 72 * scale;
  return `
    <text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="900" letter-spacing="-8" fill="${colors.primary}">q</text>
    <text x="${x + 44 * scale}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="900" font-style="italic" letter-spacing="-6" fill="${colors.darkPurple}">st</text>
  `;
}

function phoneFrame(x, y, w, h, content) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="#0b1020" stroke="${colors.border}" stroke-width="2"/>
    <rect x="${x + 18}" y="${y + 18}" width="${w - 36}" height="${h - 36}" rx="24" fill="${colors.surface}"/>
    <circle cx="${x + w / 2}" cy="${y + 12}" r="4" fill="${colors.border}"/>
    ${content}
  `;
}

function pill(x, y, text, fill, stroke = fill, color = colors.white) {
  const width = Math.max(78, text.length * 10 + 28);
  return `
    <rect x="${x}" y="${y}" width="${width}" height="34" rx="17" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <text x="${x + width / 2}" y="${y + 22}" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="800" text-anchor="middle" fill="${color}">${esc(text)}</text>
  `;
}

function sceneMarkup(scene) {
  if (scene === "map") {
    return `
      <path d="M622 78 C733 45 846 75 938 36 L938 442 C827 481 718 449 606 480 Z" fill="#17223a"/>
      <path d="M646 157 C733 118 801 210 910 168" fill="none" stroke="${colors.primary}" stroke-width="12" stroke-linecap="round" opacity=".8"/>
      <path d="M646 304 C741 250 815 360 924 291" fill="none" stroke="${colors.accent}" stroke-width="9" stroke-linecap="round" opacity=".85"/>
      <circle cx="706" cy="169" r="24" fill="${colors.primary}"/>
      <circle cx="706" cy="169" r="10" fill="${colors.white}"/>
      <circle cx="853" cy="298" r="24" fill="${colors.success}"/>
      <circle cx="853" cy="298" r="10" fill="${colors.white}"/>
      ${phoneFrame(612, 112, 250, 312, `
        <text x="646" y="172" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" fill="${colors.white}">Quest nearby</text>
        ${pill(646, 196, "100 XP", "#342515", colors.accent, colors.accent)}
        <rect x="646" y="250" width="180" height="12" rx="6" fill="${colors.border}"/>
        <rect x="646" y="276" width="132" height="12" rx="6" fill="${colors.border}"/>
        <rect x="646" y="330" width="176" height="54" rx="14" fill="${colors.primary}"/>
        <text x="734" y="364" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" text-anchor="middle" fill="${colors.white}">Accept</text>
      `)}
    `;
  }

  if (scene === "cards") {
    return `
      <g transform="translate(640 70) rotate(-7)">
        <rect width="246" height="340" rx="26" fill="${colors.surface2}" stroke="${colors.border}" stroke-width="2"/>
        ${pill(28, 34, "HIKING", "#2b2152", colors.primary, colors.primary)}
        <text x="28" y="124" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900" fill="${colors.white}">Sunset trail</text>
        <text x="28" y="164" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="${colors.muted}">Walk a new route and</text>
        <text x="28" y="190" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="${colors.muted}">capture the view.</text>
        <rect x="28" y="256" width="190" height="52" rx="16" fill="${colors.primary}"/>
      </g>
      <g transform="translate(770 104) rotate(8)">
        <rect width="220" height="306" rx="24" fill="#25344a" stroke="${colors.border}" stroke-width="2"/>
        ${pill(24, 32, "ART", "#2b2152", colors.primary, colors.primary)}
        <text x="24" y="118" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="${colors.white}">Sketch stop</text>
      </g>
      <circle cx="660" cy="404" r="44" fill="${colors.accent}" opacity=".92"/>
      <text x="660" y="415" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" text-anchor="middle" fill="#1b1302">AI</text>
    `;
  }

  if (scene === "proof") {
    return phoneFrame(650, 70, 258, 356, `
      <rect x="686" y="116" width="186" height="150" rx="22" fill="#0d1324" stroke="${colors.border}" stroke-width="2"/>
      <circle cx="739" cy="174" r="28" fill="${colors.primary}"/>
      <path d="M704 236 L750 198 L785 226 L812 202 L856 236 Z" fill="${colors.success}"/>
      <rect x="686" y="292" width="186" height="56" rx="16" fill="${colors.primary}"/>
      <text x="779" y="327" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" text-anchor="middle" fill="${colors.white}">Upload proof</text>
      <circle cx="875" cy="112" r="46" fill="${colors.success}"/>
      <path d="M853 112 L870 129 L899 94" fill="none" stroke="${colors.white}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    `);
  }

  if (scene === "friends") {
    return `
      <circle cx="690" cy="176" r="58" fill="${colors.primary}"/>
      <circle cx="806" cy="176" r="58" fill="${colors.accent}"/>
      <circle cx="748" cy="276" r="66" fill="${colors.success}"/>
      <path d="M704 278 L740 314 L804 234" fill="none" stroke="${colors.white}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="612" y="366" width="272" height="54" rx="27" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
      <text x="748" y="401" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" text-anchor="middle" fill="${colors.white}">Approved by friends</text>
    `;
  }

  return `
    <circle cx="744" cy="232" r="128" fill="#231744" stroke="${colors.primary}" stroke-width="4"/>
    <circle cx="744" cy="232" r="86" fill="${colors.primary}"/>
    <text x="744" y="247" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="900" text-anchor="middle" fill="${colors.white}">XP</text>
    <path d="M904 122 L926 168 L977 176 L940 212 L949 263 L904 239 L859 263 L868 212 L831 176 L882 168 Z" fill="${colors.accent}"/>
    <rect x="620" y="380" width="250" height="18" rx="9" fill="${colors.border}"/>
    <rect x="620" y="380" width="182" height="18" rx="9" fill="${colors.success}"/>
  `;
}

function graphicSvg(item, index) {
  const bgGradient = `grad-${index}`;
  const title = item.titleLines
    .map((line, lineIndex) => {
      const y = 218 + lineIndex * 54;
      return `<text x="80" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="900" fill="${colors.white}">${esc(line)}</text>`;
    })
    .join("");
  const subtitle = item.subtitleLines
    .map((line, lineIndex) => {
      const y = 322 + lineIndex * 30;
      return `<text x="82" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="500" fill="${colors.muted}">${esc(line)}</text>`;
    })
    .join("");
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="${bgGradient}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors.bg}"/>
        <stop offset="58%" stop-color="${colors.bg2}"/>
        <stop offset="100%" stop-color="#1d1635"/>
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#000000" flood-opacity=".28"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${bgGradient})"/>
    <circle cx="882" cy="54" r="146" fill="${colors.primary}" opacity=".18"/>
    <circle cx="560" cy="482" r="180" fill="${colors.primary}" opacity=".12"/>
    <g filter="url(#softShadow)">
    <rect x="44" y="42" width="508" height="416" rx="34" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
    </g>
    <rect x="80" y="78" width="142" height="74" rx="18" fill="#fbfbfb"/>
    ${qstLogo(101, 132, 0.66)}
    ${title}
    ${subtitle}
    ${pill(82, 388, item.tag, "#2b2152", colors.primary, colors.primary)}
    ${sceneMarkup(item.scene)}
  </svg>`;
}

async function render() {
  await mkdir(outputDir, { recursive: true });

  for (let i = 0; i < graphics.length; i += 1) {
    const item = graphics[i];
    const svg = graphicSvg(item, i);
    const out = path.join(outputDir, item.file);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log(out);
  }
}

await render();

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outputDir = process.argv[2] ?? "play-store-wide-screenshots";
const prefix = process.argv[3] ?? "qst-wide";
const width = Number(process.argv[4] ?? 1920);
const height = Number(process.argv[5] ?? 1080);
const deviceLabel = process.argv[6] ?? "Tablet";

const VB_W = 1600;
const VB_H = 900;

const colors = {
  bg: "#0f172a",
  bg2: "#121b31",
  surface: "#1e293b",
  surface2: "#253247",
  border: "#40506a",
  muted: "#a7b2c3",
  white: "#f8fafc",
  primary: "#8b5cf6",
  darkPurple: "#301264",
  accent: "#f59e0b",
  success: "#10b981",
  red: "#f87171",
};

const screens = [
  {
    file: "01-discover",
    titleLines: ["Discover", "real-world quests"],
    subtitleLines: ["AI quests based on hobbies,", "location, and what sounds fun."],
    scene: "discover",
  },
  {
    file: "02-quest-cards",
    titleLines: ["Swipe through", "adventures"],
    subtitleLines: ["Accept a quest, reject the rest,", "and keep the day moving."],
    scene: "cards",
  },
  {
    file: "03-proof-upload",
    titleLines: ["Complete quests", "with proof"],
    subtitleLines: ["Upload a photo after finishing", "a real-world challenge."],
    scene: "proof",
  },
  {
    file: "04-social-feed",
    titleLines: ["Friends verify", "completions"],
    subtitleLines: ["Approvals unlock XP, levels,", "and new badges."],
    scene: "social",
  },
  {
    file: "05-profile-rewards",
    titleLines: ["Level up", "your profile"],
    subtitleLines: ["Track XP, achievements, badges,", "and completed adventures."],
    scene: "profile",
  },
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function logo(x, y, scale = 1) {
  return `
    <rect x="${x}" y="${y - 50 * scale}" width="${144 * scale}" height="${72 * scale}" rx="${18 * scale}" fill="#fbfbfb"/>
    <text x="${x + 22 * scale}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${54 * scale}" font-weight="900" letter-spacing="-6" fill="${colors.primary}">q</text>
    <text x="${x + 62 * scale}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${54 * scale}" font-weight="900" font-style="italic" letter-spacing="-5" fill="${colors.darkPurple}">st</text>
  `;
}

function pill(x, y, text, fill, stroke = fill, color = colors.white) {
  const w = Math.max(100, text.length * 10 + 32);
  return `
    <rect x="${x}" y="${y}" width="${w}" height="38" rx="19" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <text x="${x + w / 2}" y="${y + 25}" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" text-anchor="middle" fill="${color}">${esc(text)}</text>
  `;
}

function nav(active) {
  const items = ["Discover", "Quests", "Feed", "Friends", "Profile"];
  return `
    <rect x="70" y="744" width="976" height="88" rx="28" fill="#111827" stroke="${colors.border}" stroke-width="2"/>
    ${items
      .map((item, index) => {
        const x = 158 + index * 196;
        const color = item === active ? colors.primary : colors.muted;
        return `<text x="${x}" y="798" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" text-anchor="middle" fill="${color}">${item}</text>`;
      })
      .join("")}
  `;
}

function frame(content, active = "Discover") {
  return `
    <rect x="48" y="52" width="1020" height="800" rx="44" fill="#0b1020" stroke="${colors.border}" stroke-width="3"/>
    <rect x="70" y="84" width="976" height="646" rx="28" fill="${colors.bg}"/>
    <rect x="70" y="84" width="976" height="76" rx="28" fill="${colors.surface}"/>
    ${logo(100, 140, 0.72)}
    <circle cx="946" cy="122" r="24" fill="#17223a" stroke="${colors.border}" stroke-width="2"/>
    <circle cx="994" cy="122" r="24" fill="#17223a" stroke="${colors.border}" stroke-width="2"/>
    ${content}
    ${nav(active)}
  `;
}

function questCard(x, y, w, h, title) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
    ${pill(x + 28, y + 30, "OUTDOOR", "#2b2152", colors.primary, colors.primary)}
    ${pill(x + 148, y + 30, "100 XP", "#342515", colors.accent, colors.accent)}
    <text x="${x + 28}" y="${y + 128}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" fill="${colors.white}">${esc(title)}</text>
    <text x="${x + 28}" y="${y + 178}" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="${colors.muted}">Explore something nearby, document it,</text>
    <text x="${x + 28}" y="${y + 212}" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="${colors.muted}">and earn rewards after approval.</text>
  `;
}

function scene(kind) {
  if (kind === "discover") {
    return frame(`
      <rect x="104" y="202" width="900" height="172" rx="28" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
      <text x="144" y="272" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="900" fill="${colors.white}">Discover a quest</text>
      <text x="146" y="324" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="${colors.muted}">Fresh quests based on your hobbies and location.</text>
      ${questCard(104, 414, 900, 260, "Sunset trail challenge")}
      <rect x="736" y="590" width="226" height="54" rx="17" fill="${colors.primary}"/>
      <text x="849" y="625" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" text-anchor="middle" fill="${colors.white}">Accept</text>
    `);
  }

  if (kind === "cards") {
    return frame(`
      <g transform="translate(220 210) rotate(-8)">${questCard(0, 0, 350, 430, "Photo walk")}</g>
      <g transform="translate(378 220) rotate(5)">${questCard(0, 0, 400, 460, "Try a new class")}</g>
      <circle cx="850" cy="604" r="56" fill="${colors.success}"/>
      <path d="M820 606 L844 630 L886 574" fill="none" stroke="${colors.white}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
    `);
  }

  if (kind === "proof") {
    return frame(`
      <rect x="104" y="204" width="430" height="420" rx="28" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
      <text x="138" y="270" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="900" fill="${colors.white}">Active quest</text>
      <text x="140" y="316" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="${colors.muted}">Neighborhood photo walk</text>
      <rect x="576" y="204" width="392" height="276" rx="28" fill="#0d1324" stroke="${colors.border}" stroke-width="2"/>
      <circle cx="680" cy="310" r="44" fill="${colors.primary}"/>
      <path d="M614 438 L724 342 L808 408 L880 346 L940 438 Z" fill="${colors.success}"/>
      <rect x="576" y="526" width="392" height="64" rx="18" fill="${colors.primary}"/>
      <text x="772" y="567" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" text-anchor="middle" fill="${colors.white}">Upload proof</text>
    `, "Quests");
  }

  if (kind === "social") {
    return frame(`
      <rect x="104" y="198" width="900" height="228" rx="28" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
      <circle cx="160" cy="260" r="30" fill="${colors.primary}"/>
      <text x="210" y="252" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="900" fill="${colors.white}">A friend completed a quest</text>
      <text x="210" y="292" font-family="Arial, Helvetica, sans-serif" font-size="19" fill="${colors.muted}">Approve their proof to unlock rewards.</text>
      <rect x="142" y="340" width="390" height="46" rx="15" fill="#132c28" stroke="${colors.success}" stroke-width="2"/>
      <text x="337" y="370" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" text-anchor="middle" fill="${colors.success}">Approve</text>
      <rect x="572" y="340" width="390" height="46" rx="15" fill="#2f1b24" stroke="${colors.red}" stroke-width="2"/>
      <text x="767" y="370" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" text-anchor="middle" fill="${colors.red}">Disapprove</text>
      <circle cx="364" cy="560" r="54" fill="${colors.primary}"/>
      <circle cx="476" cy="560" r="54" fill="${colors.accent}"/>
      <circle cx="420" cy="650" r="62" fill="${colors.success}"/>
      <path d="M385 652 L414 681 L462 616" fill="none" stroke="${colors.white}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="580" y="580" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="${colors.white}">Friend approval</text>
      <text x="582" y="622" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="${colors.muted}">More than 50% approval</text>
      <text x="582" y="654" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="${colors.muted}">turns a post into XP.</text>
    `, "Feed");
  }

  return frame(`
    <rect x="104" y="204" width="900" height="150" rx="28" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
    <circle cx="178" cy="278" r="44" fill="${colors.primary}"/>
    <text x="178" y="293" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" text-anchor="middle" fill="${colors.white}">7</text>
    <text x="250" y="270" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900" fill="${colors.white}">Level 7 Adventurer</text>
    <rect x="250" y="304" width="500" height="18" rx="9" fill="${colors.border}"/>
    <rect x="250" y="304" width="344" height="18" rx="9" fill="${colors.success}"/>
    <text x="104" y="436" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" fill="${colors.white}">Badges</text>
    ${["Fiery Artisan", "Trail Scout", "Food Explorer", "Photo Proof"].map((text, i) => {
      const x = 104 + (i % 2) * 450;
      const y = 474 + Math.floor(i / 2) * 104;
      const fill = [colors.accent, colors.success, colors.primary, "#38bdf8"][i];
      return `
        <rect x="${x}" y="${y}" width="408" height="78" rx="20" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
        <circle cx="${x + 44}" cy="${y + 39}" r="26" fill="${fill}"/>
        <text x="${x + 86}" y="${y + 47}" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="900" fill="${colors.white}">${esc(text)}</text>
      `;
    }).join("")}
  `, "Profile");
}

function svg(screen) {
  const title = screen.titleLines
    .map((line, index) => {
      const y = 190 + index * 52;
      return `<text x="1128" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="${colors.white}">${esc(line)}</text>`;
    })
    .join("");
  const subtitle = screen.subtitleLines
    .map((line, index) => {
      const y = 306 + index * 34;
      return `<text x="1130" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="23" fill="${colors.muted}">${esc(line)}</text>`;
    })
    .join("");
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${VB_W}" height="${VB_H}" viewBox="0 0 ${VB_W} ${VB_H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors.bg}"/>
        <stop offset="58%" stop-color="${colors.bg2}"/>
        <stop offset="100%" stop-color="#1d1635"/>
      </linearGradient>
    </defs>
    <rect width="${VB_W}" height="${VB_H}" fill="url(#bg)"/>
    <circle cx="1420" cy="80" r="260" fill="${colors.primary}" opacity=".15"/>
    <circle cx="120" cy="850" r="260" fill="${colors.primary}" opacity=".09"/>
    ${scene(screen.scene)}
    ${title}
    ${subtitle}
    ${pill(1130, 392, deviceLabel.toUpperCase(), "#2b2152", colors.primary, colors.primary)}
    <rect x="1130" y="504" width="340" height="18" rx="9" fill="${colors.border}"/>
    <rect x="1130" y="548" width="256" height="18" rx="9" fill="${colors.border}"/>
    <rect x="1130" y="592" width="306" height="18" rx="9" fill="${colors.border}"/>
  </svg>`;
}

async function render() {
  await mkdir(outputDir, { recursive: true });

  for (const screen of screens) {
    const file = `${prefix}-${screen.file}.png`;
    const out = path.join(outputDir, file);
    await sharp(Buffer.from(svg(screen))).resize(width, height).png({ compressionLevel: 9 }).toFile(out);
    console.log(out);
  }
}

await render();

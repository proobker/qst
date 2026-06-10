import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outputDir = process.argv[2] ?? "play-store-phone-screenshots";

const W = 1080;
const H = 1920;

const colors = {
  bg: "#0f172a",
  bg2: "#121b31",
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

const screens = [
  {
    file: "qst-screenshot-01-discover.png",
    title: "Discover real-world quests",
    subtitle: "Swipe through adventures built around your hobbies and location.",
    active: "Discover",
    body: "discover",
  },
  {
    file: "qst-screenshot-02-accept.png",
    title: "Accept what sounds fun",
    subtitle: "Pick quests, reject the rest, and keep your day moving.",
    active: "Discover",
    body: "accept",
  },
  {
    file: "qst-screenshot-03-proof.png",
    title: "Upload proof",
    subtitle: "Complete quests in the real world and post a photo.",
    active: "Quests",
    body: "proof",
  },
  {
    file: "qst-screenshot-04-social.png",
    title: "Get approved by friends",
    subtitle: "Friends vote on completions before rewards unlock.",
    active: "Feed",
    body: "social",
  },
  {
    file: "qst-screenshot-05-profile.png",
    title: "Level up your life",
    subtitle: "Earn XP, collect badges, and build your adventure profile.",
    active: "Profile",
    body: "profile",
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
    <rect x="${x}" y="${y - 52 * scale}" width="${144 * scale}" height="${72 * scale}" rx="${18 * scale}" fill="#fbfbfb"/>
    <text x="${x + 22 * scale}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${54 * scale}" font-weight="900" letter-spacing="-6" fill="${colors.primary}">q</text>
    <text x="${x + 62 * scale}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${54 * scale}" font-weight="900" font-style="italic" letter-spacing="-5" fill="${colors.darkPurple}">st</text>
  `;
}

function pill(x, y, text, fill, stroke = fill, color = colors.white) {
  const width = Math.max(120, text.length * 13 + 36);
  return `
    <rect x="${x}" y="${y}" width="${width}" height="48" rx="24" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
    <text x="${x + width / 2}" y="${y + 31}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" text-anchor="middle" fill="${color}">${esc(text)}</text>
  `;
}

function topBar() {
  return `
    <rect x="0" y="0" width="${W}" height="126" fill="${colors.bg}" opacity=".94"/>
    ${logo(44, 92, 0.86)}
    <circle cx="886" cy="68" r="30" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
    <circle cx="960" cy="68" r="30" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/>
    <path d="M876 68 L888 80 L903 54" fill="none" stroke="${colors.success}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="960" cy="62" r="9" fill="${colors.primary}"/>
    <path d="M944 84 C952 72 968 72 976 84" fill="none" stroke="${colors.muted}" stroke-width="6" stroke-linecap="round"/>
  `;
}

function bottomNav(active) {
  const items = ["Discover", "Quests", "Feed", "Friends", "Profile"];
  const icons = {
    Discover: "M0 -22 L20 20 L0 12 L-20 20 Z",
    Quests: "M-18 -20 L14 -20 L14 22 L-2 12 L-18 22 Z",
    Feed: "M-18 -20 H18 V-8 H-18 Z M-18 0 H18 V12 H-18 Z M-18 20 H10",
    Friends: "M-22 12 C-14 -8 14 -8 22 12 M-11 -20 A11 11 0 1 0 -10.9 -20 M20 -20 A11 11 0 1 0 20.1 -20",
    Profile: "M-24 22 C-18 0 18 0 24 22 M0 -22 A15 15 0 1 0 .1 -22",
  };

  return `
    <rect x="0" y="1760" width="${W}" height="160" fill="${colors.bg}" stroke="${colors.border}" stroke-width="2"/>
    ${items
      .map((item, index) => {
        const x = 92 + index * 224;
        const isActive = item === active;
        const color = isActive ? colors.primary : colors.muted;
        return `
          <g transform="translate(${x} 1818)">
            <path d="${icons[item]}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
            <text y="58" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" text-anchor="middle" fill="${color}">${item}</text>
          </g>`;
      })
      .join("")}
  `;
}

function header(title, subtitle) {
  return `
    <text x="54" y="212" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="900" fill="${colors.white}">${esc(title)}</text>
    <text x="56" y="264" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="500" fill="${colors.muted}">${esc(subtitle)}</text>
  `;
}

function questCard(x, y, w, h, title, body, reward = "100 XP") {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="${colors.surface}" stroke="${colors.border}" stroke-width="3"/>
    ${pill(x + 34, y + 38, "GLASSBLOWING", "#2b2152", colors.primary, colors.primary)}
    ${pill(x + 34, y + 102, reward, "#342515", colors.accent, colors.accent)}
    <text x="${x + 34}" y="${y + 210}" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="900" fill="${colors.white}">${esc(title)}</text>
    <text x="${x + 34}" y="${y + 276}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${colors.muted}">${esc(body[0])}</text>
    <text x="${x + 34}" y="${y + 322}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${colors.muted}">${esc(body[1])}</text>
    <text x="${x + 34}" y="${y + 368}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${colors.muted}">${esc(body[2])}</text>
  `;
}

function discoverBody() {
  return `
    <rect x="54" y="330" width="972" height="276" rx="34" fill="${colors.surface}" stroke="${colors.border}" stroke-width="3"/>
    <text x="100" y="436" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="900" fill="${colors.white}">Quest discovery</text>
    <text x="102" y="498" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${colors.muted}">New activities based on hobbies,</text>
    <text x="102" y="544" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${colors.muted}">location, and real-world context.</text>
    ${questCard(54, 690, 972, 820, "Studio showcase", ["Visit a local creative space.", "Document the experience.", "Earn XP when friends approve."], "100 XP")}
    <rect x="104" y="1350" width="396" height="84" rx="24" fill="transparent" stroke="${colors.border}" stroke-width="3"/>
    <text x="302" y="1403" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="${colors.muted}">Reject</text>
    <rect x="580" y="1350" width="396" height="84" rx="24" fill="${colors.primary}"/>
    <text x="778" y="1403" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="${colors.white}">Accept</text>
  `;
}

function acceptBody() {
  return `
    <g transform="translate(165 360) rotate(-7)">
      ${questCard(0, 0, 750, 790, "Sunset trail", ["Explore a new walking route.", "Capture the best view.", "Turn movement into progress."], "75 XP")}
    </g>
    <g transform="translate(260 472) rotate(5)">
      <rect x="0" y="0" width="680" height="720" rx="34" fill="${colors.surface2}" stroke="${colors.border}" stroke-width="3"/>
      ${pill(42, 46, "FITNESS", "#2b2152", colors.primary, colors.primary)}
      ${pill(42, 110, "125 XP", "#342515", colors.accent, colors.accent)}
      <text x="42" y="224" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" fill="${colors.white}">Try a new class</text>
      <text x="42" y="292" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${colors.muted}">Accept quests that fit</text>
      <text x="42" y="338" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${colors.muted}">your day and mood.</text>
      <rect x="42" y="586" width="596" height="86" rx="24" fill="${colors.primary}"/>
      <text x="340" y="640" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900" text-anchor="middle" fill="${colors.white}">Accept quest</text>
    </g>
    <circle cx="864" cy="1238" r="78" fill="${colors.success}"/>
    <path d="M824 1240 L856 1272 L910 1202" fill="none" stroke="${colors.white}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

function proofBody() {
  return `
    <rect x="54" y="330" width="972" height="1220" rx="36" fill="${colors.surface}" stroke="${colors.border}" stroke-width="3"/>
    <text x="102" y="428" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900" fill="${colors.white}">Active quest</text>
    <text x="102" y="492" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="${colors.muted}">Neighborhood photo walk</text>
    <rect x="102" y="570" width="876" height="520" rx="34" fill="#0d1324" stroke="${colors.border}" stroke-width="3"/>
    <circle cx="330" cy="760" r="82" fill="${colors.primary}"/>
    <path d="M162 1014 L360 838 L512 960 L644 826 L920 1014 Z" fill="${colors.success}"/>
    <circle cx="830" cy="642" r="58" fill="${colors.accent}"/>
    <rect x="102" y="1168" width="876" height="96" rx="28" fill="${colors.primary}"/>
    <text x="540" y="1228" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" text-anchor="middle" fill="${colors.white}">Upload proof</text>
    <rect x="102" y="1328" width="876" height="120" rx="28" fill="#162033" stroke="${colors.border}" stroke-width="3"/>
    <text x="142" y="1386" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${colors.muted}">Post your completion so friends can</text>
    <text x="142" y="1432" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${colors.muted}">approve and unlock your reward.</text>
  `;
}

function socialBody() {
  return `
    <rect x="54" y="330" width="972" height="540" rx="36" fill="${colors.surface}" stroke="${colors.border}" stroke-width="3"/>
    <circle cx="126" cy="418" r="38" fill="${colors.primary}"/>
    <text x="190" y="410" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="${colors.white}">Rabi completed a quest</text>
    <text x="190" y="452" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="${colors.muted}">Glassblowing Studio Showcase</text>
    <rect x="102" y="518" width="876" height="210" rx="26" fill="#0d1324" stroke="${colors.border}" stroke-width="3"/>
    <path d="M142 682 L286 568 L400 662 L514 594 L624 682 Z" fill="${colors.success}"/>
    <circle cx="806" cy="582" r="50" fill="${colors.accent}"/>
    <rect x="102" y="768" width="408" height="64" rx="20" fill="#132c28" stroke="${colors.success}" stroke-width="3"/>
    <text x="306" y="810" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" text-anchor="middle" fill="${colors.success}">Approve</text>
    <rect x="570" y="768" width="408" height="64" rx="20" fill="#2f1b24" stroke="${colors.red}" stroke-width="3"/>
    <text x="774" y="810" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" text-anchor="middle" fill="${colors.red}">Disapprove</text>
    <rect x="54" y="948" width="972" height="440" rx="36" fill="${colors.surface}" stroke="${colors.border}" stroke-width="3"/>
    <text x="104" y="1054" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="${colors.white}">Friend-powered rewards</text>
    <circle cx="220" cy="1202" r="62" fill="${colors.primary}"/>
    <circle cx="340" cy="1202" r="62" fill="${colors.accent}"/>
    <circle cx="280" cy="1306" r="72" fill="${colors.success}"/>
    <path d="M236 1308 L270 1342 L330 1262" fill="none" stroke="${colors.white}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="460" y="1212" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${colors.muted}">More than 50% approval</text>
    <text x="460" y="1260" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${colors.muted}">turns a post into XP.</text>
  `;
}

function profileBody() {
  return `
    <rect x="54" y="330" width="972" height="360" rx="36" fill="${colors.surface}" stroke="${colors.border}" stroke-width="3"/>
    <circle cx="164" cy="450" r="72" fill="${colors.primary}"/>
    <text x="164" y="472" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" text-anchor="middle" fill="${colors.white}">7</text>
    <text x="270" y="438" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="${colors.white}">Level 7 Adventurer</text>
    <text x="272" y="494" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${colors.muted}">2,450 XP earned</text>
    <rect x="270" y="552" width="620" height="28" rx="14" fill="${colors.border}"/>
    <rect x="270" y="552" width="434" height="28" rx="14" fill="${colors.success}"/>
    <rect x="54" y="760" width="972" height="660" rx="36" fill="${colors.surface}" stroke="${colors.border}" stroke-width="3"/>
    <text x="104" y="858" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="${colors.white}">Badges</text>
    ${["Fiery Artisan", "Trail Scout", "Food Explorer", "Photo Proof"].map((text, i) => {
      const x = 104 + (i % 2) * 438;
      const y = 930 + Math.floor(i / 2) * 190;
      const fill = [colors.accent, colors.success, colors.primary, "#38bdf8"][i];
      return `
        <rect x="${x}" y="${y}" width="376" height="136" rx="28" fill="#17223a" stroke="${colors.border}" stroke-width="3"/>
        <circle cx="${x + 68}" cy="${y + 68}" r="42" fill="${fill}"/>
        <text x="${x + 136}" y="${y + 60}" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" fill="${colors.white}">${esc(text)}</text>
        <text x="${x + 136}" y="${y + 98}" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="${colors.muted}">Unlocked</text>
      `;
    }).join("")}
  `;
}

function body(kind) {
  if (kind === "discover") return discoverBody();
  if (kind === "accept") return acceptBody();
  if (kind === "proof") return proofBody();
  if (kind === "social") return socialBody();
  return profileBody();
}

function svg(screen) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors.bg}"/>
        <stop offset="58%" stop-color="${colors.bg2}"/>
        <stop offset="100%" stop-color="#1d1635"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <circle cx="930" cy="226" r="220" fill="${colors.primary}" opacity=".13"/>
    <circle cx="82" cy="1570" r="260" fill="${colors.primary}" opacity=".09"/>
    ${topBar()}
    ${header(screen.title, screen.subtitle)}
    ${body(screen.body)}
    ${bottomNav(screen.active)}
  </svg>`;
}

async function render() {
  await mkdir(outputDir, { recursive: true });

  for (const screen of screens) {
    const out = path.join(outputDir, screen.file);
    await sharp(Buffer.from(svg(screen))).png({ compressionLevel: 9 }).toFile(out);
    console.log(out);
  }
}

await render();

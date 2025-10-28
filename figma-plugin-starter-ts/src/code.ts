// Simple in-memory cache for remote avatar bytes during a plugin run
const REMOTE_CACHE: Record<string, Uint8Array[]> = {};

// Populate Lineup — Built-in data only (no Figma Variables)
// - Supports locale: English (en), Swedish (sv), Swiss (ch)
// - Supports boys / girls
// - Supports shuffle + start shirt number
// - Finds text layers named: "player-name" and "shirt-number"

function postToUI(type: string, payload: unknown) {
  try {
    figma.ui.postMessage({ type, payload });
  } catch {}
}

function findFirstTextByName(root: SceneNode, target: string): TextNode | null {
  if ("findAll" in root) {
    const arr = (root as ChildrenMixin).findAll(
      (n) => n.type === "TEXT" && n.name === target
    ) as TextNode[];
    return arr && arr.length > 0 ? arr[0] : null;
  }
  return null;
}

async function ensureEditable(node: TextNode) {
  if (node.fontName === figma.mixed) {
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      node.fontName = { family: "Inter", style: "Regular" };
    } catch {
      await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
      node.fontName = { family: "Roboto", style: "Regular" };
    }
  } else {
    await figma.loadFontAsync(node.fontName as FontName);
  }
}

function normalizeLocale(lc: string): "en" | "sv" | "ch" {
  const v = (lc || "en").toLowerCase();
  if (v === "sv" || v === "se") return "sv";
  if (v === "ch" || v === "de") return "ch";
  return "en";
}

// ---- Inline avatar helpers (no imports / no bundler required) ----
type LocaleX = "en" | "sv" | "ch";
type GenderX = "boys" | "girls";
type AvatarStyleX = { bg: string; fg: string };

const PALETTES_INLINE: Record<LocaleX, Record<GenderX, AvatarStyleX[]>> = {
  en: {
    boys: [
      { bg: "#2E7D32", fg: "#FFFFFF" },
      { bg: "#1565C0", fg: "#FFFFFF" },
      { bg: "#6A1B9A", fg: "#FFFFFF" },
      { bg: "#EF6C00", fg: "#FFFFFF" },
      { bg: "#00897B", fg: "#FFFFFF" },
      { bg: "#37474F", fg: "#FFFFFF" },
      { bg: "#7B1FA2", fg: "#FFFFFF" },
      { bg: "#1B5E20", fg: "#FFFFFF" },
      { bg: "#512DA8", fg: "#FFFFFF" },
      { bg: "#455A64", fg: "#FFFFFF" },
      { bg: "#0277BD", fg: "#FFFFFF" },
      { bg: "#C62828", fg: "#FFFFFF" },
    ],
    girls: [
      { bg: "#AD1457", fg: "#FFFFFF" },
      { bg: "#5E35B1", fg: "#FFFFFF" },
      { bg: "#00838F", fg: "#FFFFFF" },
      { bg: "#F4511E", fg: "#FFFFFF" },
      { bg: "#6D4C41", fg: "#FFFFFF" },
      { bg: "#9C27B0", fg: "#FFFFFF" },
      { bg: "#7CB342", fg: "#FFFFFF" },
      { bg: "#039BE5", fg: "#FFFFFF" },
      { bg: "#8E24AA", fg: "#FFFFFF" },
      { bg: "#D81B60", fg: "#FFFFFF" },
      { bg: "#EC407A", fg: "#FFFFFF" },
      { bg: "#00897B", fg: "#FFFFFF" },
    ],
  },
  sv: {
    boys: [
      { bg: "#1B5E20", fg: "#FFFFFF" },
      { bg: "#0D47A1", fg: "#FFFFFF" },
      { bg: "#4A148C", fg: "#FFFFFF" },
      { bg: "#EF6C00", fg: "#FFFFFF" },
      { bg: "#2E7D32", fg: "#FFFFFF" },
      { bg: "#455A64", fg: "#FFFFFF" },
      { bg: "#6A1B9A", fg: "#FFFFFF" },
      { bg: "#1565C0", fg: "#FFFFFF" },
      { bg: "#7B1FA2", fg: "#FFFFFF" },
      { bg: "#37474F", fg: "#FFFFFF" },
      { bg: "#00897B", fg: "#FFFFFF" },
      { bg: "#C62828", fg: "#FFFFFF" },
    ],
    girls: [
      { bg: "#D81B60", fg: "#FFFFFF" },
      { bg: "#8E24AA", fg: "#FFFFFF" },
      { bg: "#039BE5", fg: "#FFFFFF" },
      { bg: "#7CB342", fg: "#FFFFFF" },
      { bg: "#9C27B0", fg: "#FFFFFF" },
      { bg: "#6D4C41", fg: "#FFFFFF" },
      { bg: "#F4511E", fg: "#FFFFFF" },
      { bg: "#00838F", fg: "#FFFFFF" },
      { bg: "#5E35B1", fg: "#FFFFFF" },
      { bg: "#AD1457", fg: "#FFFFFF" },
      { bg: "#EC407A", fg: "#FFFFFF" },
      { bg: "#00897B", fg: "#FFFFFF" },
    ],
  },
  ch: {
    boys: [
      { bg: "#2E7D32", fg: "#FFFFFF" },
      { bg: "#1565C0", fg: "#FFFFFF" },
      { bg: "#6A1B9A", fg: "#FFFFFF" },
      { bg: "#EF6C00", fg: "#FFFFFF" },
      { bg: "#00897B", fg: "#FFFFFF" },
      { bg: "#37474F", fg: "#FFFFFF" },
      { bg: "#7B1FA2", fg: "#FFFFFF" },
      { bg: "#1B5E20", fg: "#FFFFFF" },
      { bg: "#512DA8", fg: "#FFFFFF" },
      { bg: "#455A64", fg: "#FFFFFF" },
      { bg: "#0277BD", fg: "#FFFFFF" },
      { bg: "#C62828", fg: "#FFFFFF" },
    ],
    girls: [
      { bg: "#D81B60", fg: "#FFFFFF" },
      { bg: "#8E24AA", fg: "#FFFFFF" },
      { bg: "#039BE5", fg: "#FFFFFF" },
      { bg: "#7CB342", fg: "#FFFFFF" },
      { bg: "#9C27B0", fg: "#FFFFFF" },
      { bg: "#6D4C41", fg: "#FFFFFF" },
      { bg: "#F4511E", fg: "#FFFFFF" },
      { bg: "#00838F", fg: "#FFFFFF" },
      { bg: "#5E35B1", fg: "#FFFFFF" },
      { bg: "#AD1457", fg: "#FFFFFF" },
      { bg: "#EC407A", fg: "#FFFFFF" },
      { bg: "#00897B", fg: "#FFFFFF" },
    ],
  },
};

function pickStyle(
  index: number,
  locale: LocaleX,
  gender: GenderX
): AvatarStyleX {
  const list = PALETTES_INLINE[locale][gender];
  return list[index % list.length];
}

function initialsFromName(fullName: string): string {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0) || "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

// Instance-safe version: update existing avatar node inside instances, only create new if editable
async function applyVectorAvatarToNode(opts: {
  host: SceneNode;
  name: string;
  style: AvatarStyleX;
  diameter?: number; // default 96
}) {
  const { host, name, style } = opts;
  const D = Math.max(16, opts.diameter ?? 96);
  const initials = initialsFromName(name);

  // Helper: find an existing avatar target node (ellipse/rect/frame with fills)
  function findAvatarTarget(
    root: SceneNode
  ): (SceneNode & GeometryMixin) | null {
    if ("findOne" in root) {
      const target = (root as ChildrenMixin).findOne((n) => {
        const isCandidateName =
          n.name === "player-avatar" ||
          n.name === "avatar" ||
          n.name === "photo";
        const hasFills = "fills" in n;
        return isCandidateName && hasFills;
      }) as (SceneNode & GeometryMixin) | null;
      return target || null;
    }
    return null;
  }

  // Helper: find optional text for initials
  function findAvatarInitials(root: SceneNode): TextNode | null {
    if ("findOne" in root) {
      return (root as ChildrenMixin).findOne(
        (n) => n.name === "player-avatar-initials" && n.type === "TEXT"
      ) as TextNode | null;
    }
    return null;
  }

  // If host is an instance, we cannot append children. Try to update existing nodes.
  const isInstance = host.type === "INSTANCE";
  const existingTarget = findAvatarTarget(host);
  const existingInitials = findAvatarInitials(host);

  if (existingTarget) {
    // Update fill color on the existing shape/frame
    const fills = Array.isArray(existingTarget.fills)
      ? existingTarget.fills.slice()
      : [];
    const paint: Paint = { type: "SOLID", color: hexToRgb(style.bg) };
    if (fills.length > 0) fills[0] = paint;
    else (fills as Paint[]).push(paint);
    existingTarget.fills = fills as ReadonlyArray<Paint>;

    // Update initials text if present
    if (existingInitials) {
      await safeLoadFontForAvatar(existingInitials);
      existingInitials.characters = initials;
      existingInitials.fills = [{ type: "SOLID", color: hexToRgb(style.fg) }];
    }
    return;
  }

  if (isInstance) {
    // Can't create new nodes inside an instance. Silently skip creating,
    // but this still counts as a successful populate for name/number.
    return;
  }

  // Host is editable (frame/group/component). Create the avatar circle + initials.
  let circle: EllipseNode | null = null;
  let text: TextNode | null = null;

  circle = figma.createEllipse();
  circle.name = "player-avatar";
  circle.resize(D, D);
  circle.x = 0;
  circle.y = 0;
  if ("appendChild" in host) (host as ChildrenMixin).appendChild(circle);
  circle.fills = [{ type: "SOLID", color: hexToRgb(style.bg) }];
  circle.strokes = [];

  text = figma.createText();
  text.name = "player-avatar-initials";
  if ("appendChild" in host) (host as ChildrenMixin).appendChild(text);
  await safeLoadFontForAvatar(text);
  text.characters = initials;
  text.fontSize = Math.round(D * 0.42);
  text.fills = [{ type: "SOLID", color: hexToRgb(style.fg) }];
  // center text over circle
  const textW = text.width,
    textH = text.height;
  text.x = circle.x + (D - textW) / 2;
  text.y = circle.y + (D - textH) / 2;
}

async function safeLoadFontForAvatar(node: TextNode) {
  try {
    if (node.fontName === figma.mixed) {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      node.fontName = { family: "Inter", style: "Regular" };
    } else {
      await figma.loadFontAsync(node.fontName as FontName);
    }
  } catch {
    await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
    node.fontName = { family: "Roboto", style: "Regular" };
  }
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
}

async function loadRemoteAvatarBytes(
  base: string,
  folder: string,
  maxCount = 60
): Promise<Uint8Array[]> {
  const out: Uint8Array[] = [];
  const clean = (base || "").replace(/\/$/, "");
  const dir = (folder || "").replace(/^\/+|\/+$/g, "");
  if (!clean || !dir) return out;

  let consecutiveMisses = 0;
  const MISS_LIMIT = 8;

  for (let i = 1; i <= maxCount; i++) {
    const n = String(i).padStart(2, "0");
    const exts = [".png", ".jpg", ".jpeg", ".webp"]; // try in order
    let found = false;

    for (const ext of exts) {
      const url = `${clean}/${dir}/${n}${ext}`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          out.push(new Uint8Array(buf));
          consecutiveMisses = 0;
          found = true;
          break; // stop trying other extensions for this index
        }
      } catch {
        // ignore and try next extension
      }
    }

    if (!found) {
      consecutiveMisses++;
      if (consecutiveMisses >= MISS_LIMIT && out.length > 0) break;
    }
  }
  return out;
}

// --- Image avatar helpers ---

function findAvatarTargetGeneric(
  root: SceneNode
): (SceneNode & GeometryMixin) | null {
  if ("findOne" in root) {
    const target = (root as ChildrenMixin).findOne((n) => {
      const isCandidateName =
        n.name === "player-avatar" || n.name === "avatar" || n.name === "photo";
      const hasFills = "fills" in n;
      return isCandidateName && hasFills;
    }) as (SceneNode & GeometryMixin) | null;
    return target || null;
  }
  return null;
}

function setImageFillOnTarget(target: SceneNode & GeometryMixin, image: Image) {
  const paints = Array.isArray(target.fills) ? target.fills.slice() : [];
  const paint: ImagePaint = {
    type: "IMAGE",
    imageHash: image.hash,
    scaleMode: "FILL",
  };
  if (paints.length > 0) paints[0] = paint;
  else (paints as Paint[]).push(paint);
  target.fills = paints as ReadonlyArray<Paint>;
}

// ---- Built-in data (so plugin is shareable without any setup) ----

function emailFromName(fullName: string, domain: string = "mail.com"): string {
  const base = (fullName || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^A-Za-z0-9\s]+/g, " ") // drop punctuation
    .trim()
    .replace(/\s+/g, ".")
    .toLowerCase();
  const cleanDomain = (domain || "mail.com").replace(/^@+/, "").trim();
  return base ? `${base}@${cleanDomain}` : `user@${cleanDomain}`;
}
function builtInNames(
  locale: string,
  set: "boys" | "girls" | "unisex" = "boys"
): string[] {
  const lc = normalizeLocale(locale);
  const data: Record<
    string,
    { boys: string[]; girls: string[]; unisex: string[] }
  > = {
    en: {
      boys: [
        "Liam Carter",
        "Noah Bennett",
        "Oliver Hayes",
        "Elijah Brooks",
        "James Porter",
        "William Reed",
        "Henry Collins",
        "Lucas Turner",
        "Benjamin Gray",
        "Alexander Miles",
        "Ethan Parker",
        "Mason Quinn",
        "Logan Davis",
        "Owen Mitchell",
        "Jack Foster",
      ],
      girls: [
        "Emma Grace",
        "Olivia Rose",
        "Ava Brooks",
        "Sophia Lane",
        "Isabella Reed",
        "Mia Collins",
        "Charlotte Hayes",
        "Amelia Quinn",
        "Harper Miles",
        "Ella Parker",
        "Evelyn Carter",
        "Abigail Moore",
        "Scarlett Davis",
        "Grace Mitchell",
        "Luna Foster",
      ],
      unisex: [
        "Alex Taylor",
        "Charlie Morgan",
        "Jamie Lee",
        "Jordan Casey",
        "Avery Parker",
        "Riley Quinn",
        "Rowan Carter",
        "Reese Cameron",
        "Dakota Blake",
        "Emerson Gray",
        "Skyler Bennett",
        "Finley Hayes",
        "Harley Collins",
        "Taylor Brooks",
        "Quinn Porter",
      ],
    },
    sv: {
      boys: [
        "Liam Andersson",
        "Noah Johansson",
        "Oliver Karlsson",
        "Elias Svensson",
        "Leo Nilsson",
        "William Eriksson",
        "Oscar Larsson",
        "Hugo Olsson",
        "Axel Persson",
        "Theo Gustafsson",
        "Viktor Lindberg",
        "Albin Berg",
        "Nils Holm",
        "Filip Sandberg",
        "Arvid Lund",
      ],
      girls: [
        "Emma Andersson",
        "Olivia Johansson",
        "Alice Karlsson",
        "Elsa Svensson",
        "Maja Nilsson",
        "Wilma Eriksson",
        "Agnes Larsson",
        "Alva Olsson",
        "Ebba Persson",
        "Freja Gustafsson",
        "Stella Lindberg",
        "Ida Berg",
        "Saga Holm",
        "Tilda Sandberg",
        "Ines Lund",
      ],
      unisex: [
        "Alex Nilsson",
        "Robin Svensson",
        "Kim Andersson",
        "Noel Berg",
        "Elis Lindberg",
        "Billie Holm",
        "Charlie Persson",
        "Jamie Larsson",
        "Mika Eriksson",
        "Lou Sandberg",
        "Sam Lund",
        "Sascha Gustafsson",
        "Neo Olsson",
        "Elli Karlsson",
        "Rio Johansson",
      ],
    },
    ch: {
      boys: [
        "Luca Müller",
        "Noah Meier",
        "Liam Schneider",
        "Leon Weber",
        "Elias Frei",
        "Finn Zimmermann",
        "Julian Keller",
        "Nico Fischer",
        "Levin Baumann",
        "Jonas Huber",
        "Matteo Wagner",
        "Moritz Graf",
        "Noel Schmid",
        "Samuel Brunner",
        "Tim Roth",
      ],
      girls: [
        "Mia Müller",
        "Emma Meier",
        "Lina Schneider",
        "Lea Weber",
        "Sofia Frei",
        "Léa Zimmermann",
        "Lina Keller",
        "Nora Fischer",
        "Alina Baumann",
        "Lena Huber",
        "Giulia Wagner",
        "Anna Graf",
        "Mila Schmid",
        "Nina Brunner",
        "Sara Roth",
      ],
      unisex: [
        "Alex Keller",
        "Robin Frei",
        "Sascha Weber",
        "Noel Graf",
        "Mika Fischer",
        "Jamie Huber",
        "Charlie Baumann",
        "Ari Meier",
        "Elia Wagner",
        "Niki Zimmermann",
        "Riley Roth",
        "Kim Schmid",
        "Skyler Brunner",
        "Rowan Müller",
        "Quinn Schneider",
      ],
    },
  };
  const bucket = data[lc] || data.en;
  return bucket[set] ? bucket[set].slice() : bucket.boys.slice();
}

function builtInMobileNumbers(): string[] {
  return [
    "070 123 1001",
    "070 123 1002",
    "070 123 1003",
    "070 123 1004",
    "070 123 1005",
    "070 123 1006",
    "070 123 1007",
    "070 123 1008",
    "070 123 1009",
    "070 123 1010",
    "070 123 9001",
    "070 123 1345",
    "070 123 7985",
    "070 123 7854",
    "070 123 9001",
    "070 123 1456",
    "070 123 0175",
    "070 123 0134",
    "070 123 0198",
    "070 123 0123",
  ];
}

function builtInPersonalIds(count: number = 20): string[] {
  const out: string[] = [];
  const seeds: Array<[number, number, number]> = [
    [1992, 3, 12],
    [1994, 6, 28],
    [1996, 10, 5],
    [1998, 0, 17],
    [1999, 8, 3],
    [2001, 1, 9],
    [2002, 4, 21],
    [2003, 7, 14],
    [2004, 11, 30],
    [2005, 2, 8],
  ];
  let seq = 1234;
  for (let i = 0; i < count; i++) {
    const [y, m, d] = seeds[i % seeds.length];
    const yyyy = String(y);
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const xxxx = String(seq + i)
      .padStart(4, "0")
      .slice(-4);
    out.push(`${yyyy}${mm}${dd}-${xxxx}`);
  }
  return out;
}

function formatDateYMD(d: Date): string {
  // Produces YYYY-MM-DD (e.g., 2025-10-28)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatTimeHM(d: Date): string {
  // 24h HH:MM in local time
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
}

const STAFF_ROLES: string[] = [
  "Coach",
  "Assistant Coach",
  "Assistant Coach",
  "Team Manager",
  "Physiotherapist",
  "Safety Officer",
  "Equipment Manager",
  "Team Doctor",
  "Analyst",
  "Strength & Conditioning",
  "Communications",
  "Operations",
];

function roleForIndex(mode: string, i: number): string {
  switch ((mode || "player").toLowerCase()) {
    case "guardian":
      return "Guardian";
    case "staff":
      return STAFF_ROLES[i % STAFF_ROLES.length];
    case "mixed": {
      const pool = ["Player", "Guardian", ...STAFF_ROLES];
      return pool[i % pool.length];
    }
    case "player":
    default:
      return "Player";
  }
}

function builtInShirtNumbers(count: number = 25): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i++) out.push(String(i));
  return out;
}

function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

figma.showUI(__html__, { width: 380, height: 340 });

figma.ui.onmessage = async (msg: any) => {
  if (!msg) return;

  if (msg.type === "scan") {
    try {
      const nameSet = msg.nameSet || "boys";
      const locale = normalizeLocale(msg.locale || "en");

      // Preview from built-ins
      const namePreview = builtInNames(locale, nameSet).slice(0, 5);
      const numberPreview = builtInShirtNumbers(10);

      const sel = figma.currentPage.selection || [];
      const selection = sel.map((n) => ({
        node: n.name,
        hasPlayerName: !!findFirstTextByName(n, "player-name"),
        hasShirtNumber: !!findFirstTextByName(n, "shirt-number"),
        hasEmail: !!findFirstTextByName(n, "email"),
        hasPersonalId: !!findFirstTextByName(n, "personal-id"),
        hasDate: !!findFirstTextByName(n, "date"),
        hasTime: !!findFirstTextByName(n, "time"),
        hasRole: !!findFirstTextByName(n, "role"),
      }));

      postToUI("scan-result", {
        names: {
          source: "built-in",
          locale,
          gender: nameSet,
          preview: namePreview,
        },
        numbers: { source: "built-in", preview: numberPreview },
        avatar: { requested: !!msg.useAvatar },
        selection,
      });
    } catch (e: any) {
      postToUI("error", "Scan failed: " + (e?.message || e));
    }
    return;
  }

  if (msg.type === "populate") {
    try {
      const nameSet: "boys" | "girls" | "unisex" =
        msg.nameSet === "girls" || msg.nameSet === "unisex"
          ? msg.nameSet
          : "boys";
      const startNum =
        typeof msg.startNumber === "number" && msg.startNumber > 0
          ? msg.startNumber | 0
          : 1;
      const shuffleNames = !!msg.shuffle;
      const locale = normalizeLocale(msg.locale || "en");
      const useAvatar = !!msg.useAvatar;
      const useMobile: boolean = !!msg.useMobile;
      const useEmail: boolean = !!msg.useEmail;
      const usePersonId: boolean = !!msg.usePersonId;
      const useDate: boolean = !!msg.useDate;
      const useTime: boolean = !!msg.useTime;
      const roleMode: string =
        typeof msg.roleMode === "string" ? msg.roleMode : "player";
      const personIds = builtInPersonalIds(20);
      const emailDomain: string =
        typeof msg.emailDomain === "string" && msg.emailDomain.trim()
          ? msg.emailDomain.trim()
          : "mail.com";
      const mobiles = builtInMobileNumbers();

      // Avatar options
      const avatarMode = msg.avatarMode || "vector"; // "vector" | "image"
      const imgBase: string =
        typeof msg.imgBase === "string" ? msg.imgBase : "";
      const teamFolder: string =
        typeof msg.teamFolder === "string" ? msg.teamFolder : "";

      // Built-in only data
      let names = builtInNames(locale, nameSet);
      let numbers = builtInShirtNumbers(25);

      if (!names.length) {
        figma.notify("No built-in names available");
        postToUI("error", "No built-in names available");
        return;
      }
      if (!numbers.length) {
        figma.notify("No built-in numbers available");
        postToUI("error", "No built-in numbers available");
        return;
      }

      const namesOrdered = names.slice();
      if (shuffleNames) shuffle(namesOrdered);
      const startIdx = Math.max(0, startNum - 1);
      const numbersOrdered = numbers
        .slice(startIdx)
        .concat(numbers.slice(0, startIdx));

      const now = new Date();
      const dateStr = formatDateYMD(now);
      const timeStr = formatTimeHM(now);

      const sel = figma.currentPage.selection || [];
      if (!sel.length) {
        figma.notify("Select frames/instances to populate");
        postToUI("error", "Select frames/instances to populate");
        return;
      }

      let remoteAvatars: Uint8Array[] = [];
      if (useAvatar && avatarMode === "image" && imgBase && teamFolder) {
        const cacheKey = `${imgBase}|${teamFolder}`;
        remoteAvatars = REMOTE_CACHE[cacheKey];
        if (!remoteAvatars) {
          remoteAvatars = await loadRemoteAvatarBytes(imgBase, teamFolder, 60);
          REMOTE_CACHE[cacheKey] = remoteAvatars;
          if (!remoteAvatars || remoteAvatars.length === 0) {
            figma.notify("No remote images found — using vector avatars.");
          }
        }
      }

      let count = 0;
      for (let i = 0; i < sel.length; i++) {
        const node = sel[i];
        const tName = findFirstTextByName(node, "player-name");
        const tNum = findFirstTextByName(node, "shirt-number");
        const tMobile = findFirstTextByName(node, "mobile-number");
        if (!tName && !tNum) continue;

        const nameVal = namesOrdered[i % namesOrdered.length];
        const numVal = numbersOrdered[i % numbersOrdered.length];

        if (tName) {
          await ensureEditable(tName);
          tName.characters = String(nameVal);
        }
        if (tNum) {
          await ensureEditable(tNum);
          tNum.characters = String(numVal);
        }
        if (useMobile && tMobile) {
          await ensureEditable(tMobile);
          tMobile.characters = String(mobiles[i % mobiles.length]);
        }
        const tEmail = findFirstTextByName(node, "email");
        if (useEmail && tEmail) {
          await ensureEditable(tEmail);
          tEmail.characters = emailFromName(String(nameVal), emailDomain);
        }
        const tPersonId = findFirstTextByName(node, "personal-id");
        if (usePersonId && tPersonId) {
          await ensureEditable(tPersonId);
          tPersonId.characters = String(personIds[i % personIds.length]);
        }
        const tDate = findFirstTextByName(node, "date");
        if (useDate && tDate) {
          await ensureEditable(tDate);
          tDate.characters = dateStr;
        }
        const tTime = findFirstTextByName(node, "time");
        if (useTime && tTime) {
          await ensureEditable(tTime);
          tTime.characters = timeStr;
        }

        const tRole = findFirstTextByName(node, "role");
        if (tRole) {
          await ensureEditable(tRole);
          tRole.characters = roleForIndex(roleMode, i);
        }

        // Optionally add/update an avatar (image or vector) if requested
        if (useAvatar) {
          const gender = nameSet === "girls" ? "girls" : "boys"; // treat unisex as boys for palette
          const target = findAvatarTargetGeneric(node);

          if (
            avatarMode === "image" &&
            target &&
            remoteAvatars &&
            remoteAvatars.length > 0
          ) {
            const b = remoteAvatars[i % remoteAvatars.length];
            try {
              const img = figma.createImage(b);
              setImageFillOnTarget(target as any, img);
            } catch (e) {
              // fallback to vector if image fails
              const style = pickStyle(i, locale as any, gender as any);
              await applyVectorAvatarToNode({
                host: node,
                name: String(nameVal),
                style,
              });
            }
          } else {
            const style = pickStyle(i, locale as any, gender as any);
            await applyVectorAvatarToNode({
              host: node,
              name: String(nameVal),
              style,
            });
          }
        }

        count++;
      }

      figma.notify("Populated " + count + " item(s).");
      postToUI("populate-done", { count });
    } catch (e: any) {
      postToUI("error", "Populate failed: " + (e?.message || e));
      figma.notify("Populate failed — see UI log.");
    }
  }
};

// avatars.ts — self-contained avatar utilities (no external images required)
// Generates circular vector avatars with initials.
// You can optionally switch to embedded PNGs by filling the arrays below.

export type Locale = "en" | "sv" | "ch";
export type Gender = "boys" | "girls";

export type AvatarStyle = {
  bg: string; // background fill (hex rgba ok)
  fg: string; // text color
};

// Palettes tuned for light/dark contrast
const PALETTES: Record<Locale, Record<Gender, AvatarStyle[]>> = {
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

// Optional: base64-embedded PNGs (leave empty to use vector avatars).
// If you later paste tiny PNG base64 strings here, your code can choose to use them.
export const AVATARS_EN_BOYS: string[] = [];
export const AVATARS_EN_GIRLS: string[] = [];
export const AVATARS_SV_BOYS: string[] = [];
export const AVATARS_SV_GIRLS: string[] = [];
export const AVATARS_CH_BOYS: string[] = [];
export const AVATARS_CH_GIRLS: string[] = [];

export function pickStyle(
  index: number,
  locale: Locale,
  gender: Gender
): AvatarStyle {
  const list = PALETTES[locale][gender];
  return list[index % list.length];
}

export function initialsFromName(fullName: string): string {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0) || "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

/**
 * Create or update a circular vector avatar inside the given node.
 * Looks for a child named "player-avatar" (ellipse/rect); if absent, creates one.
 * Also places/updates a text child named "player-avatar-initials".
 */
export async function applyVectorAvatarToNode(opts: {
  host: SceneNode;
  name: string;
  style: AvatarStyle;
  diameter?: number; // default 96
}) {
  const { host, name, style } = opts;
  const D = Math.max(16, opts.diameter ?? 96);
  const initials = initialsFromName(name);

  // Find or create avatar circle
  let circle: EllipseNode | null = null;
  let text: TextNode | null = null;
  if ("findOne" in host) {
    circle = (host as ChildrenMixin).findOne(
      (n) =>
        n.name === "player-avatar" &&
        (n.type === "ELLIPSE" || n.type === "RECTANGLE")
    ) as EllipseNode | null;
    text = (host as ChildrenMixin).findOne(
      (n) => n.name === "player-avatar-initials" && n.type === "TEXT"
    ) as TextNode | null;
  }
  if (!circle) {
    circle = figma.createEllipse();
    circle.name = "player-avatar";
    circle.resize(D, D);
    // place at host origin (you can adjust as needed in your component)
    circle.x = 0;
    circle.y = 0;
    if ("appendChild" in host) (host as ChildrenMixin).appendChild(circle);
  }
  // Fill circle
  circle.fills = [{ type: "SOLID", color: hexToRgb(style.bg) }];
  circle.strokes = [];

  // Text for initials
  if (!text) {
    text = figma.createText();
    text.name = "player-avatar-initials";
    if ("appendChild" in host) (host as ChildrenMixin).appendChild(text);
  }
  await safeLoadFont(text);
  text.characters = initials;
  text.fontSize = Math.round(D * 0.42);
  text.fills = [{ type: "SOLID", color: hexToRgb(style.fg) }];
  // center text over circle
  const textW = text.width,
    textH = text.height;
  text.x = circle.x + (D - textW) / 2;
  text.y = circle.y + (D - textH) / 2;
}

async function safeLoadFont(node: TextNode) {
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

// Utility: convert hex like "#RRGGBB" to {r,g,b}
function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
}

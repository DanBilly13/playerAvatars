import { copyFileSync, mkdirSync, existsSync, cpSync } from "node:fs";
import { dirname } from "node:path";
try {
  mkdirSync("dist", { recursive: true });
  copyFileSync("src/ui.html", "dist/ui.html");
  console.log("[copy-ui] Copied src/ui.html -> dist/ui.html");
} catch (e) {
  console.error("[copy-ui] Failed:", e);
  process.exit(1);
}
// Copy /src/images => /dist/images (if present)
try {
  if (existsSync("src/images")) {
    mkdirSync("dist/images", { recursive: true });
    cpSync("src/images", "dist/images", { recursive: true });
    console.log("[copy-ui] Copied src/images -> dist/images");
  }
} catch (e) {
  console.error("[copy-ui] Failed to copy images:", e);
}

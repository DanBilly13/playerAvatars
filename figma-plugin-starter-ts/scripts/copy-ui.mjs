import { copyFileSync, mkdirSync, existsSync, cpSync } from "node:fs";

try {
  // Ensure /dist exists
  mkdirSync("dist", { recursive: true });

  // Copy UI HTML
  copyFileSync("src/ui.html", "dist/ui.html");
  console.log("[copy-ui] Copied src/ui.html -> dist/ui.html");

  // Copy /src/images if present
  if (existsSync("src/images")) {
    mkdirSync("dist/images", { recursive: true });
    cpSync("src/images", "dist/images", { recursive: true });
    console.log("[copy-ui] Copied src/images -> dist/images");
  }

  // Copy Figma Plugin DS CSS
  const dsSource = "node_modules/figma-plugin-ds/dist/figma-plugin-ds.css";
  const dsTarget = "dist/figma-plugin-ds.css";
  if (existsSync(dsSource)) {
    copyFileSync(dsSource, dsTarget);
    console.log(
      "[copy-ui] Copied figma-plugin-ds.css -> dist/figma-plugin-ds.css"
    );
  } else {
    console.warn(
      "[copy-ui] Warning: figma-plugin-ds.css not found in node_modules."
    );
  }
} catch (e) {
  console.error("[copy-ui] Failed:", e);
  process.exit(1);
}

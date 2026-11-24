// node scripts/render_caps.mjs <compId> <outDir> [from-to]  — images PNG transparentes (calque de sous-titres)
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [id, outDir, range] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, browserExecutable, timeoutInMilliseconds: 300000 });
const t0 = Date.now();
await renderFrames({ composition, serveUrl, outputDir: path.resolve(outDir), imageFormat: "png", browserExecutable, concurrency: 1,
  frameRange: range ? range.split("-").map(Number) : null, inputProps: {}, onStart: () => {}, timeoutInMilliseconds: 600000,
  onFrameUpdate: (n) => { if (n % 200 === 0) console.log("frames", n, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } });
console.log("done", ((Date.now() - t0) / 1000).toFixed(0) + "s");

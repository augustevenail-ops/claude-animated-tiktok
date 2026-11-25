// node scripts/render-appel.mjs <sortie.mp4> : rendu complet de la vidéo « Le Téléphone rouge » (1440x2560, 30 i/s)
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
const out = process.argv[2];
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "AppelVideo", browserExecutable, chromiumOptions, timeoutInMilliseconds: 300000 });
const t0 = Date.now();
await renderMedia({
  composition, serveUrl, codec: "h264", outputLocation: out, browserExecutable, chromiumOptions,
  concurrency: 2, timeoutInMilliseconds: 600000, imageFormat: "jpeg", jpegQuality: 92, crf: 18, pixelFormat: "yuv420p",
  onProgress: ({ renderedFrames }) => { if (renderedFrames % 150 === 0) console.log(((Date.now() - t0) / 60000).toFixed(1) + " min", renderedFrames, "/", composition.durationInFrames); },
});
console.log("done", ((Date.now() - t0) / 60000).toFixed(1) + " min");

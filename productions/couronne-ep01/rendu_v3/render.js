// node render.js [scène ...] -> out/<scène>.png (1080x1920) + apercu/planche_v2.jpg
const fs = require("fs"), path = require("path"), { chromium } = require("playwright");
const D = __dirname, css = fs.readFileSync(path.join(D, "fonts/embed.css"), "utf8");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] }), p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(`<html><head><style>${css} body{margin:0;background:#000}</style></head><body><canvas id=c width=1080 height=1920></canvas></body></html>`);
  await p.addScriptTag({ content: ["draw_base.js","fx.js","helpers.js","scenes.js"].map(f => fs.readFileSync(path.join(D, f), "utf8")).join("\n") });
  await p.evaluate(async () => { for (const f of ["800 20px Montserrat", "900 20px Montserrat", "600 20px Oswald", "500 20px 'Roboto Mono'", "400 20px 'Permanent Marker'"]) await document.fonts.load(f); });
  const want = process.argv.slice(2), names = (await p.evaluate(() => Object.keys(window.SCENES))).filter(n => !want.length || want.includes(n));
  fs.mkdirSync(path.join(D, "out"), { recursive: true });
  for (const n of names) {
    const err = await p.evaluate(n => { try { const g = document.getElementById("c").getContext("2d", { willReadFrequently: true }); g.reset(); window.SCENES[n](g); return null; } catch (e) { return e.stack; } }, n);
    if (err) { console.log("ERREUR", n, err); continue; }
    await p.locator("#c").screenshot({ path: path.join(D, "out", n + ".png") }); console.log("ok", n);
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });

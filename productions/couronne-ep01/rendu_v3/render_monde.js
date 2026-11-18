// node render_monde.js [scène ...] -> out/<scène>.png ; comme render.js, mais polices intégrées (base64)
// et images du monde 3D (../monde3d/out/*.png) disponibles dans window.IMG3D pour bg3d(g, nom).
const fs = require("fs"), path = require("path"), { chromium } = require("playwright");
const D = __dirname, FD = path.join(D, "fonts"), M = path.join(D, "../monde3d/out");
const css = [["Montserrat", "800", "Montserrat-800.woff2"], ["Montserrat", "900", "Montserrat-900.woff2"], ["Oswald", "500", "Oswald-500.woff2"], ["Oswald", "600", "Oswald-600.woff2"], ["Oswald", "700", "Oswald-700.woff2"], ["Permanent Marker", "400", "PermanentMarker-400.woff2"], ["Roboto Mono", "500", "RobotoMono-500.woff2"], ["Roboto Mono", "700", "RobotoMono-700.woff2"]]
  .map(([f, w, file]) => `@font-face{font-family:"${f}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FD, file)).toString("base64")}) format("woff2");}`).join("");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] }), p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(`<html><head><style>${css} body{margin:0;background:#000}</style></head><body><canvas id=c width=1080 height=1920></canvas></body></html>`);
  const imgs = fs.existsSync(M) ? Object.fromEntries(fs.readdirSync(M).filter(f => f.endsWith(".png")).map(f => [f.slice(0, -4), "data:image/png;base64," + fs.readFileSync(path.join(M, f)).toString("base64")])) : {};
  await p.evaluate(async imgs => { window.IMG3D = {}; await Promise.all(Object.entries(imgs).map(([k, u]) => new Promise(r => { const i = new Image(); i.onload = r; i.src = u; window.IMG3D[k] = i; }))); }, imgs);
  await p.addScriptTag({ content: ["draw_base.js", "fx.js", "helpers.js", "scenes.js"].map(f => fs.readFileSync(path.join(D, f), "utf8")).join("\n") });
  await p.evaluate(async () => { for (const f of ["800 20px Montserrat", "900 20px Montserrat", "600 20px Oswald", "500 20px 'Roboto Mono'", "400 20px 'Permanent Marker'"]) await document.fonts.load(f); });
  const want = process.argv.slice(2), names = (await p.evaluate(() => Object.keys(window.SCENES))).filter(n => !want.length || want.includes(n));
  for (const n of names) {
    const err = await p.evaluate(n => { try { const g = document.getElementById("c").getContext("2d", { willReadFrequently: true }); g.reset(); window.SCENES[n](g); return null; } catch (e) { return e.stack; } }, n);
    if (err) { console.log("ERREUR", n, err); continue; }
    await p.locator("#c").screenshot({ path: path.join(D, "out", n + ".png") }); console.log("ok", n);
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });

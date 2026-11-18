// node render3d.js [plan ...] [--w 540 --h 960] -> out/<plan>.png  (rendu WebGL headless du monde 3D)
const fs = require("fs"), path = require("path"), { chromium } = require("playwright");
const D = __dirname, args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
const W = opt("--w", 1080), H = opt("--h", 1920), want = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] || "").startsWith("--"));
const types = { ".js": "text/javascript", ".html": "text/html", ".json": "application/json" };
(async () => {
  const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }), p = await b.newPage();
  p.on("pageerror", e => console.log("ERREUR page", e.message)); p.on("console", m => m.type() === "error" && console.log("console", m.text()));
  await p.route("http://monde/**", r => { const f = path.join(D, decodeURIComponent(new URL(r.request().url()).pathname));
    fs.existsSync(f) ? r.fulfill({ body: fs.readFileSync(f), contentType: types[path.extname(f)] || "application/octet-stream" }) : r.fulfill({ status: 404 }); });
  await p.goto("http://monde/index.html"); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  const names = want.length ? want : await p.evaluate(() => Object.keys(window.SHOTS_LIST || {}));
  fs.mkdirSync(path.join(D, "out"), { recursive: true });
  for (const n of names) { const t = Date.now(); const url = await p.evaluate(([n, w, h]) => window.render(n, w, h), [n, W, H]);
    fs.writeFileSync(path.join(D, "out", n + ".png"), Buffer.from(url.split(",")[1], "base64")); console.log("ok", n, (Date.now() - t) + " ms"); }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });

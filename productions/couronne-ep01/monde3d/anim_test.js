// node anim_test.js plan:u,u,u ... -> out/anim/<plan>_<u>.jpg (contrôle des trajectoires animées, 540x960)
const fs = require("fs"), path = require("path"), { chromium } = require("playwright");
const D = __dirname, types = { ".js": "text/javascript", ".html": "text/html" };
(async () => {
  const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }), p = await b.newPage();
  p.on("pageerror", e => console.log("ERREUR page", e.message));
  await p.route("http://monde/**", r => { const f = path.join(D, decodeURIComponent(new URL(r.request().url()).pathname)); fs.existsSync(f) ? r.fulfill({ body: fs.readFileSync(f), contentType: types[path.extname(f)] || "application/octet-stream" }) : r.fulfill({ status: 404 }); });
  await p.goto("http://monde/index.html"); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  fs.mkdirSync(path.join(D, "out/anim"), { recursive: true });
  for (const a of process.argv.slice(2)) { const [n, us] = a.split(":"); for (const u of us.split(",")) { const t = Date.now();
    const url = await p.evaluate(([n, u]) => window.renderAt(n, u, u * 3, 540, 960), [n, +u]);
    fs.writeFileSync(path.join(D, "out/anim", `${n}_${u}.jpg`), Buffer.from(url.split(",")[1], "base64")); console.log(n, u, Date.now() - t, "ms"); } }
  await b.close();
})();

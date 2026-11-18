// node render.js  -> PNG par scène dans out/ (1080x1920 ; aperçus 540x960 via convert)
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const src = fs.readFileSync(path.join(__dirname, "figures.js"), "utf8").replace(/^export /gm, "");
const scenes = fs.readFileSync(path.join(__dirname, "scenes.js"), "utf8");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.setContent("<body style='margin:0;background:#000'><canvas id=c width=1080 height=1920></canvas></body>");
  await p.addScriptTag({ content: src });
  await p.addScriptTag({ content: scenes });
  const names = await p.evaluate(() => Object.keys(window.SCENES));
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  for (const n of names) {
    await p.evaluate(name => window.SCENES[name](document.getElementById("c").getContext("2d")), n);
    await p.locator("#c").screenshot({ path: path.join(__dirname, "out", n + ".png") });
    console.log("ok", n);
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });

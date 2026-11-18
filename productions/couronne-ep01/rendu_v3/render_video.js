// node render_video.js [--from s --to s] [--out video/couronne_ep01.mp4]
// Vidéo complète calée sur la voix : plans de PLAN_DES_PLANS (plans_ep01.json), scènes validées, sous-titres karaoké
// mot à mot (mots_v11.json corrigés d'après le script), dézoom d'entrée 1,1 s, fondu noir de 0,1 s en fin de plan,
// alarme animée (plans 2c à 4), HUD et sous-titres dessinés hors zoom, dans la zone visible sur écran 19,5:9.
const fs = require("fs"), path = require("path"), { spawn } = require("child_process"), { chromium } = require("playwright");
const D = __dirname, P = path.join(D, ".."), FD = path.join(D, "fonts"), M = path.join(P, "monde3d/out");
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FPS = 30, plans = JSON.parse(fs.readFileSync(path.join(P, "plans_ep01.json"))).plans, TOTAL = 72.6;
// v8 : plan 6 (Conseil) rallongé, plan 7 raccourci d'autant
{ const p6 = plans.find(p => p.n === 6), p7 = plans.find(p => p.n === 7); p6.fin = p7.debut = 11.6; }
const OUT = path.join(D, opt("--out", "video/couronne_ep01.mp4")), T0 = +opt("--from", 0), T1 = +opt("--to", TOTAL);
// v10 : --k 2 = 4K natif (2160x3840, hidpi.js) ; --k3 = échelle des images 3D (défaut = k) ; --crf / --preset de l'encodage des morceaux
const K = +opt("--k", 1), K3 = +opt("--k3", K), CRF = opt("--crf", "12"), PRESET = opt("--preset", "slow");

// ---------- scène par plan (sous-plans du plan 2 inclus) ----------
const SC = { 1: "p01_noir_imagine", 3: "a03_compte_foule", 4: "a04_foule_dessus", 5: "m06_zone_large", 6: "k06_conseil", 7: "m07_travers_champ",   // v7 : la vue large passe au plan 5, salle du Conseil au plan 6
  8: "h08_holo_carte", 9: "m09_regle1", 10: "g10_aerien", 11: "p11_pere_buste_sans_feuille", 12: "d1_dossier", 13: "v13_rue_vivante", 14: "v14_escorte_vivante",
  15: "v15_pere_vivant", 16: "v16_prends_vivant", 17: "c2_heros_buste", 18: "v18_garde_vivant", 19: "m19_drone_centre", 20: "m20_drone_approche", 21: "m21_regle2",
  22: "v22_mur_vivant", 23: "c8_heros_feuille", 24: "w4_feuille_lecture", 25: "w4_feuille_lecture", 26: "a26_foule_haut_parleur", 27: "h27_holo_retraction",
  28: "c6b_garde_gros_plan", 29: "a29_heros_foule", 30: "c9_pere_cellule", 31: "v41_p31_choix", 32: "fin_carte" };
const ALARM = new Set(["b02_choc_chute", "a03_compte_foule", "a04_foule_dessus"]), ALARM_T0 = 0.62, ALARM_PER = 1.2;
// pop zoom (départ très serré, 1 s jusqu'au cadre normal) : plans de personnage et d'objet ; pas sur les FPV ni les hologrammes en orbite
const POP = new Set([3, 4, 11, 12, 15, 17, 18, 23, 24, 26, 28, 29, 30, 31]);
const CAM3D = { m05_drone_district: "d05a_drone_district", m06_zone_large: "d05b_zone_large", m07_travers_champ: "d05c_travers_champ", h08_holo_carte: "h08_holo", m09_regle1: "r01_regle1_mur",
  g10_aerien: "o10_aerien", k06_conseil: "d06_conseil", v13_rue_vivante: "s13_rue_matin", v14_escorte_vivante: "s14_rue_escorte", v15_pere_vivant: "s15_rue_proche", v16_prends_vivant: "s16_rue_angle", v18_garde_vivant: "s18_centre_avenue",
  m19_drone_centre: "d19_drone_centre", m20_drone_approche: "d20_drone_approche", m21_regle2: "r21_regle2_1m", v22_mur_vivant: "w22_le_mur", m20_regle2_un: "d19r21_plonge", h27_holo_retraction: "h27_holo" };
const shots = [];
for (const p of plans) {
  if (p.n === 2) [["p02o2_vol_droit", 0.10, 0.52], ["b02_choc_chute", 0.52, p.fin]]                 // vol droit, puis choc + chute suivie + arrêt sur les personnages (une seule prise)
    .forEach(([s, a, b], k) => shots.push({ n: 2, scene: s, a, b, pop: false, fade: k === 1 }));
  else if (p.n === 21 || p.n === 19) continue;                                                                   // v8 : plans 20 + 21 = une seule prise (zoom sur la façade jusqu'à la règle 2)
  else if (p.n === 20) shots.push({ n: 20, scene: "m20_regle2_un", a: plans.find(q => q.n === 19).debut, b: plans.find(q => q.n === 21).fin, pop: false, fade: true, push: null });
  else shots.push({ n: p.n, scene: SC[p.n], a: p.debut, b: p.fin, pop: POP.has(p.n), fade: p.n !== 32 && p.n !== 1, push: p.n === 25 ? [1.45, 1.55] : null, pushY: p.n === 25 ? 1000 : null, capDy: p.n === 25 ? 260 : 0 });
}
// image 3D animée (caméra qui bouge à chaque image) pour les plans posés dans le monde 3D
// v10 : point de départ du dézoom d'entrée (x, y du visage, zoom de départ) et HUD par plan ([horloge ou null, compte à rebours])
const FOCUS = { 3: [550, 710, 2.4], 4: [540, 950, 3.6], 11: [540, 1080, 2.3], 12: [540, 970, 2.4], 15: [540, 907, 1.9], 17: [540, 1060, 2.2],
  18: [540, 995, 3.8], 23: [540, 1037, 2.2], 24: [550, 907, 2.2], 26: [540, 1100, 3.0], 28: [548, 972, 1.9], 29: [551, 1296, 3.8], 30: [541, 1199, 2.3], 31: [538, 1037, 2.2] };
// coupure le jour 1 à 07:00 + 72 h ; le soir même = jour 1, le lendemain matin = jour 2
const HUDT = { 2: ["07:00", "72 H"], 3: ["07:00", "72 H"], 4: ["07:01", "71 H"], 5: ["07:01", "71 H"], 6: ["07:02", "71 H"], 7: ["07:02", "71 H"], 8: ["07:03", "71 H"],
  9: ["07:03", "71 H"], 10: ["07:04", "71 H"], 11: ["18:40", "60 H"], 12: ["21:10", "57 H"], 13: ["07:02", "47 H"], 14: ["07:03", "47 H"], 15: ["07:04", "47 H"],
  16: ["07:05", "47 H"], 17: ["07:06", "47 H"], 18: ["07:20", "47 H"], 19: ["07:40", "47 H"], 20: ["07:40", "47 H"], 21: ["07:40", "47 H"], 22: ["07:45", "47 H"],
  23: ["08:10", "46 H"], 24: ["08:10", "46 H"], 25: ["08:11", "46 H"], 26: ["12:00", "43 H"], 27: ["12:01", "43 H"], 28: ["12:02", "42 H"], 29: ["12:03", "42 H"],
  30: ["23:50", "31 H"], 31: ["23:55", "31 H"] };
for (const sh of shots) { sh.focus = FOCUS[sh.n] || null; sh.hud = HUDT[sh.n] || null; }
for (const sh of shots) { sh.cam3d = CAM3D[sh.scene] || null; if (sh.scene === "k06_conseil") sh.span = 0.42; }   // plan 6 : 3D seulement pendant l'approche
{
}

fs.mkdirSync(path.join(D, "video"), { recursive: true });
// ---------- sous-titres : mots corrigés, regroupés par 1 à 3 mots, sans traverser une coupe ----------
const raw = JSON.parse(fs.readFileSync(path.join(P, "voix_v9/mots_v11.json")));
const words = [];
for (const w of raw) { if (/^['\-?]/.test(w.w) && words.length) { const l = words[words.length - 1]; l.w += (w.w === "?" ? " ?" : w.w); l.e = w.e; } else words.push({ ...w }); }
const FIX = { "dégarde": "des gardes", "l'emmène,@30": "l'emmènent,", "prend": "prends", "dépit": "déplies", "mente.": "mentent.", "il@53": "ils", "répond,": "répond\u00a0:", "phrase,": "phrase\u00a0:", "radio,@55": "radio\u00a0:", "exécuté.": "exécuté,", "d'ici": "d'ici" };
const fixed = [];
for (const w of words) { const k = Object.keys(FIX).find(k => { const [t, s] = k.split("@"); return t === w.w && (!s || Math.floor(w.s) === +s); });
  const txt = k ? FIX[k] : w.w, parts = txt.split(" ");
  parts.forEach((t, i) => fixed.push({ w: t.toUpperCase(), s: w.s + (w.e - w.s) * i / parts.length, e: w.s + (w.e - w.s) * (i + 1) / parts.length })); }
fixed.splice(0, fixed.length, ...fixed.filter(w => w.s < 69.0));                           // v10 : pas de sous-titres sur « Abonne-toi pour la partie 2 »
const planOf = t => (plans.find(p => t >= p.debut - 0.07 && t < p.fin - 0.07) || plans[plans.length - 1]).n;
const chunks = []; let cur = null;
for (const w of fixed) { const pn = planOf(w.s), len = cur ? cur.w.reduce((a, x) => a + x.w.length, 0) + w.w.length : 0;
  if (!cur || cur.pn !== pn || cur.w.length >= 3 || len > 15 || /[.,:?!]$/.test(cur.w[cur.w.length - 1].w)) { cur = { pn, w: [] }; chunks.push(cur); }
  cur.w.push(w); }
chunks.forEach((c, i) => { c.a = c.w[0].s - 2 / FPS; c.b = Math.min(68.99 - 2 / FPS, chunks[i + 1] ? chunks[i + 1].w[0].s - 2 / FPS : TOTAL); });   // v10 : rien sur le carton final
fs.writeFileSync(path.join(D, "video/sous_titres.json"), JSON.stringify(chunks.map(c => ({ a: +c.a.toFixed(2), b: +c.b.toFixed(2), mots: c.w.map(w => [w.w, w.s]) })), null, 1));

// ---------- rendu ----------
const css = [["Montserrat", "800", "Montserrat-800.woff2"], ["Montserrat", "900", "Montserrat-900.woff2"], ["Oswald", "500", "Oswald-500.woff2"], ["Oswald", "600", "Oswald-600.woff2"], ["Oswald", "700", "Oswald-700.woff2"], ["Permanent Marker", "400", "PermanentMarker-400.woff2"], ["Roboto Mono", "500", "RobotoMono-500.woff2"], ["Roboto Mono", "700", "RobotoMono-700.woff2"]]
  .map(([f, w, file]) => `@font-face{font-family:"${f}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FD, file)).toString("base64")}) format("woff2");}`).join("");
(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const b = await chromium.launch({ args: ["--no-sandbox"] }), p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on("pageerror", e => console.log("ERREUR page", e.message));
  await p.setContent(`<html><head><style>${css} body{margin:0;background:#000}</style></head><body><canvas id=c width=1080 height=1920></canvas></body></html>`);
  const imgs = Object.fromEntries(fs.readdirSync(M).filter(f => f.endsWith(".png")).map(f => [f.slice(0, -4), "data:image/png;base64," + fs.readFileSync(path.join(M, f)).toString("base64")]));
  await p.evaluate(async imgs => { window.IMG3D = {}; await Promise.all(Object.entries(imgs).map(([k, u]) => new Promise(r => { const i = new Image(); i.onload = () => { if (window.hiImage) hiImage(i, 1080, 1920); r(); }; i.src = u; window.IMG3D[k] = i; }))); }, imgs);
  await p.addScriptTag({ content: `window.KS = ${K};\n` + fs.readFileSync(path.join(D, "hidpi.js"), "utf8") });
  await p.addScriptTag({ content: ["draw_base.js", "fx.js", "helpers.js", "scenes.js", "scenes_v7.js", "scenes_v8.js", "scenes_v9.js", "scenes_v10.js"].map(f => fs.readFileSync(path.join(D, f), "utf8")).join("\n") });
  await p.evaluate(async () => { for (const f of ["800 20px Montserrat", "900 20px Montserrat", "600 20px Oswald", "500 20px 'Roboto Mono'", "400 20px 'Permanent Marker'"]) await document.fonts.load(f); });
  await p.addScriptTag({ content: `
    if (window.hiCanvas) hiCanvas(document.getElementById("c"), W, H);
    const BG = mk(W, H); const bgx = BG.getContext("2d", { willReadFrequently: true });
    const _hud = hud, _cap = caption; let hudArgs = null, curKey = null;
    window.layerScene = (name) => { bgx.reset(); hudArgs = null; hud = (g, o) => { hudArgs = o || {}; }; caption = () => {};
      try { window.SCENES_ALL[name](bgx); } finally { hud = _hud; caption = _cap; } };
    const ease = x => 1 - Math.pow(1 - x, 3);
    window.setImg3d = (k, url) => new Promise(r => { const i = new Image(); i.onload = () => { if (window.hiImage) hiImage(i, 1080, 1920); window.IMG3D[k] = i; r(); }; i.src = url; });
    window.frame = (f) => {
      const { t, shot, chunk, alarmPh, fadeK } = f, g = document.getElementById("c").getContext("2d"), u = (t - shot.a) / (shot.b - shot.a), ts = t - shot.a;
      window.ALARM_PH = alarmPh; window.TT = t; window.TU = u; window.TS = ts;
      layerScene(shot.scene);                                                          // la scène est redessinée à chaque image (tout bouge)
      g.reset(); g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
      let s = 1, dx = 0, dy = 0, rot = 0;
      if (shot.push) { s = shot.push[0] + (shot.push[1] - shot.push[0]) * u; if (shot.pushY) dy = (shot.pushY - H / 2) * (1 - s); }   // pushY : point fixe du zoom (texte de la feuille au-dessus des sous-titres)
      else if ((!shot.cam3d || shot.span) && shot.n !== 1) { s = 1.04 + 0.05 * u; dx = Math.sin(t * 0.55) * 12; dy = Math.sin(t * 0.43 + 1) * 9; rot = Math.sin(t * 0.31) * 0.005; }   // caméra qui dérive sans arrêt
      let fx = W / 2, fy = H / 2;
      if (shot.pop && ts < 1) { const F = shot.focus || [540, 800, 2.6], kk = Math.pow(1 - ts, 3);   // v10 : part très serré sur le visage, dézoom rapide en 1 s
        s *= 1 + (F[2] - 1) * kk; fx = W / 2 + (F[0] - W / 2) * kk; fy = H / 2 + (F[1] - H / 2) * kk; }
      g.save(); g.translate(W / 2 + dx, H / 2 + dy); g.rotate(rot); g.scale(s, s); g.translate(-fx, -fy); g.drawImage(BG, 0, 0); g.restore();
      window.LASTHUD = hudArgs ? { ...hudArgs } : null;
      if (hudArgs && shot.hud) { if (!hudArgs.label || hudArgs.label === "COUPURE") { hudArgs.value = shot.hud[1]; if (!hudArgs.label) delete hudArgs.valueRed; } if (shot.hud[0]) hudArgs.clock = shot.hud[0]; }   // v10
      if (hudArgs) hud(g, hudArgs);
      if (chunk) { const ws = chunk.mots.map(m => m[0]); let act = 0; chunk.mots.forEach((m, i) => { if (t >= m[1] - 2 / 30) act = i; });
        const k = Math.min(1, (t - chunk.a) / 0.16), cs = 1 + 0.07 * Math.pow(1 - k, 3);                 // mini-dézoom rapide à l'apparition de chaque sous-titre
        g.save(); if (shot.capDy) g.translate(0, shot.capDy); g.translate(W / 2, 1212); g.scale(cs, cs); g.translate(-W / 2, -1212); caption(g, ws, act); g.restore(); }
      if (fadeK > 0) { g.fillStyle = "rgba(0,0,0," + fadeK + ")"; g.fillRect(0, 0, W, H); }
      return document.getElementById("c").toDataURL("image/jpeg", 0.98);
    };` });
  const b3 = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }), p3 = await b3.newPage(), MD = path.join(P, "monde3d"), types = { ".js": "text/javascript", ".html": "text/html" };
  p3.on("pageerror", e => console.log("ERREUR 3D", e.message));
  await p3.route("http://monde/**", r => { const f = path.join(MD, decodeURIComponent(new URL(r.request().url()).pathname)); fs.existsSync(f) ? r.fulfill({ body: fs.readFileSync(f), contentType: types[path.extname(f)] || "application/octet-stream" }) : r.fulfill({ status: 404 }); });
  await p3.goto("http://monde/index.html"); await p3.waitForFunction(() => window.READY, null, { timeout: 180000 });
  const subs = JSON.parse(fs.readFileSync(path.join(D, "video/sous_titres.json")));
  const tmp = OUT.replace(/\.mp4$/, "_muet.mp4");
  const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", PRESET, "-tune", "animation", "-crf", CRF, "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", tmp], { stdio: ["pipe", "inherit", "inherit"] });
  const n0 = Math.round(T0 * FPS), n1 = Math.round(T1 * FPS), t_start = Date.now(), AT = opt("--at", null), ATDIR = opt("--atdir", path.join(D, "out/controle"));
  const list = AT ? AT.split(",").map(x => Math.floor(+x * FPS)) : Array.from({ length: n1 - n0 }, (_, i) => n0 + i);   // --at t1,t2 : images de contrôle seulement
  if (AT) fs.mkdirSync(ATDIR, { recursive: true });
  for (const n of list) {
    const t = (n + 0.5) / FPS, shot = shots.find(s => t >= s.a && t < s.b) || shots[shots.length - 1];
    const chunk = subs.find(c => t >= c.a && t < c.b) || null;
    const alarmPh = ALARM.has(shot.scene) ? (((t - ALARM_T0) / ALARM_PER) % 1 + 1) % 1 : null;
    const left = (shot.b - t) * FPS; let fadeK = shot.fade && left < 3 ? [1, 0.66, 0.33][Math.floor(left)] : 0;
    if (shot.n === 32 && TOTAL - t < 0.6) fadeK = 1 - (TOTAL - t) / 0.6;                                        // fondu au noir final
    const u0 = (t - shot.a) / (shot.b - shot.a);
    if (shot.cam3d && (!shot.span || u0 < shot.span)) { const u3 = shot.span ? u0 / shot.span : u0, j = await p3.evaluate(([n, u, t, ts, w, h]) => window.renderAt(n, u, t, w, h, ts), [shot.cam3d, u3, t, t - shot.a, Math.round(1080 * K3), Math.round(1920 * K3)]); await p.evaluate(([k, j]) => window.setImg3d(k, j), [shot.cam3d, j]); }
    const url = await p.evaluate(f => window.frame(f), { t, shot, chunk, alarmPh: alarmPh == null ? null : Math.round(alarmPh * 48) / 48, fadeK });
    if (AT) { fs.writeFileSync(path.join(ATDIR, `t${t.toFixed(2)}.jpg`), Buffer.from(url.split(",")[1], "base64")); console.log("t", t.toFixed(2), "plan", shot.n, JSON.stringify(await p.evaluate(() => window.LASTHUD))); continue; }
    if (!ff.stdin.write(Buffer.from(url.split(",")[1], "base64"))) await new Promise(r => ff.stdin.once("drain", r));
    if (n % 150 === 0) console.log(`image ${n}/${n1}  t=${t.toFixed(2)} s  plan ${shot.n} ${shot.scene}  ${((Date.now() - t_start) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on("close", r)); await b.close(); await b3.close();
  if (AT) { fs.existsSync(tmp) && fs.unlinkSync(tmp); console.log("contrôle ok", ATDIR); return; }
  if (args.includes("--novoice")) { fs.renameSync(tmp, OUT); console.log("morceau ok", OUT); return; }   // morceau muet (rendu découpé, assemblé par render_parts.sh)
  // voix + export 1080 et 2K (1440x2560)
  const voix = path.join(P, "voix_v9/voix_complete_v11.mp3"), dur = String((n1 - n0) / FPS);
  const mux = (o, extra) => new Promise(r => spawn("ffmpeg", ["-loglevel", "error", "-y", "-i", tmp, "-ss", String(T0), "-i", voix, ...extra, "-map", "0:v:0", "-map", "1:a:0", "-af", "apad", "-t", dur, "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", o], { stdio: "inherit" }).on("close", r));
  await mux(OUT, ["-c:v", "copy"]);
  await mux(OUT.replace(/\.mp4$/, "_2K.mp4"), ["-vf", "scale=1440:2560:flags=lanczos", "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p"]);
  fs.unlinkSync(tmp); console.log("ok", OUT);
})().catch(e => { console.error(e); process.exit(1); });

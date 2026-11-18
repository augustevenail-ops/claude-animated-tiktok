// hidpi.js : rendu 4K natif (window.KS = 2 -> 2160x3840) sans toucher aux scènes écrites en coordonnées 1080x1920.
// Chaque canvas créé par mk() a une taille réelle x KS et garde sa taille logique (width/height renvoient la taille 1080).
// Les contextes 2D de ces canvas ont une transformation de base x KS ; ce que le canvas n'échelonne pas tout seul est corrigé :
// filter (blur en px), shadowBlur / shadowOffset, getImageData / putImageData, drawImage d'un canvas ou d'une image 3D, motifs.
(() => {
  const K = window.KS || 1; if (K === 1) return;
  const P = CanvasRenderingContext2D.prototype, C = HTMLCanvasElement.prototype;
  const oST = P.setTransform, oReset = P.reset, oGet = C.getContext, oDI = P.drawImage, oGID = P.getImageData, oPID = P.putImageData, oPat = P.createPattern;
  const wd = Object.getOwnPropertyDescriptor(C, "width"), hd = Object.getOwnPropertyDescriptor(C, "height");
  window.hiCanvas = (c, w, h) => {                       // canvas logique w x h, réel w*K x h*K
    wd.set.call(c, Math.round(w * K)); hd.set.call(c, Math.round(h * K)); c._k = K; let lw = w, lh = h;
    Object.defineProperty(c, "width", { get: () => lw, set: v => { lw = v; wd.set.call(c, Math.round(v * K)); if (c._ctx) oST.call(c._ctx, K, 0, 0, K, 0, 0); } });
    Object.defineProperty(c, "height", { get: () => lh, set: v => { lh = v; hd.set.call(c, Math.round(v * K)); if (c._ctx) oST.call(c._ctx, K, 0, 0, K, 0, 0); } });
    Object.defineProperty(c, "_lw", { get: () => lw }); Object.defineProperty(c, "_lh", { get: () => lh });
    return c;
  };
  window.hiImage = (i, w, h) => { i._k = i.naturalWidth / w; Object.defineProperty(i, "_lw", { value: w }); Object.defineProperty(i, "_lh", { value: h }); return i; };
  C.getContext = function (t, o) { const c = oGet.call(this, t, o); if (t === "2d" && this._k && !c._hi) { c._hi = true; this._ctx = c; oST.call(c, K, 0, 0, K, 0, 0); } return c; };
  P.reset = function () { oReset.call(this); if (this._hi) oST.call(this, K, 0, 0, K, 0, 0); };
  P.setTransform = function (a, b, c, d, e, f) { if (!this._hi || typeof a !== "number") return oST.apply(this, arguments); oST.call(this, a * K, b * K, c * K, d * K, e * K, f * K); };
  P.resetTransform = function () { this._hi ? oST.call(this, K, 0, 0, K, 0, 0) : oST.call(this, 1, 0, 0, 1, 0, 0); };
  P.getImageData = function (x, y, w, h, o) { return this._hi ? oGID.call(this, x * K, y * K, w * K, h * K, o) : oGID.apply(this, arguments); };
  P.putImageData = function (id, x, y) { return this._hi && arguments.length === 3 ? oPID.call(this, id, x * K, y * K) : oPID.apply(this, arguments); };
  P.drawImage = function (s, ...a) {
    if (s && s._lw !== undefined) {
      if (a.length === 2) return oDI.call(this, s, a[0], a[1], s._lw, s._lh);
      if (a.length === 8) { const k = s._k; return oDI.call(this, s, a[0] * k, a[1] * k, a[2] * k, a[3] * k, a[4], a[5], a[6], a[7]); }
    }
    return oDI.call(this, s, ...a);
  };
  P.createPattern = function (s, r) { const p = oPat.call(this, s, r); if (p && s && s._k && s._k !== 1) p.setTransform(new DOMMatrix().scale(1 / s._k)); return p; };
  const fd = Object.getOwnPropertyDescriptor(P, "filter");
  Object.defineProperty(P, "filter", { get() { return fd.get.call(this); }, set(v) { fd.set.call(this, this._hi && typeof v === "string" ? v.replace(/(-?[\d.]+)px/g, (m, n) => (+n * K) + "px") : v); } });
  for (const k of ["shadowBlur", "shadowOffsetX", "shadowOffsetY"]) {
    const d = Object.getOwnPropertyDescriptor(P, k);
    Object.defineProperty(P, k, { get() { const r = d.get.call(this); return this._hi ? r / K : r; }, set(v) { d.set.call(this, this._hi ? v * K : v); } });
  }
})();

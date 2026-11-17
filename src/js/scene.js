/* ==== 場面の絵のしくみ（持ち主：リーダー）：mountScene・sceneLoop。昼の絵は day-scene.js（昼のチャット）。絵がある画面（昼）でだけ動く（夜はハイグラの舞台・前のドットの夜は 11/18 にけずった） ==== */
const SW = 96, SH = 48, FLOOR = 41;
const scn = { mode: 'day', cust: [], speed: 1, bg: {}, cv: null, raf: 0, last: 0 };
const CANDY_CV = new Map();
const candyCv = key => { if (!CANDY_CV.has(key)) CANDY_CV.set(key, candyCanvas(key)); return CANDY_CV.get(key); };

function mountScene(mode) {
  scn.cv = $('scene'); scn.mode = mode;
  if (!scn.cv) return;
  scn.cv.width = SW; scn.cv.height = SH;
  if (!scn.raf) scn.raf = requestAnimationFrame(sceneLoop);
}
function sceneLoop(ts) {
  const cv = scn.cv;
  if (!cv || !cv.isConnected) { scn.raf = 0; scn.last = 0; return; }   // 場面の絵がない画面では止める（11/18 軽量化：前はずっと回っていた）。mountScene でまた動く
  scn.raf = requestAnimationFrame(sceneLoop);
  const dt = Math.min(0.1, (ts - (scn.last || ts)) / 1000); scn.last = ts;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  drawDay(g, ts / 1000, dt);
}
function painter(g) { return (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); }; }

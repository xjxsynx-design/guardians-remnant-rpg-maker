
/* Guardians' Remnant — Phase 4C (ALTTP-ish editor feel)
   - Canvas renderer (pixelated tiles)
   - Two layers: terrain + objects
   - Export/Import JSON + Save/Load localStorage
   - Mobile-first pointer painting
*/

const GRID = { w: 20, h: 20 }; // feels more like a real map than 10x10
const STORAGE_KEY = "gr_world_editor_v4c";

const BIOMES = {
  Overworld: {
    terrain: ["Grass", "Dirt", "Stone"],
    objects: ["Chest", "Tree", "Rock"]
  },
  Ruins: {
    terrain: ["Stone", "Moss", "Dirt"],
    objects: ["Chest", "Pillar", "Rubble"]
  },
  Frozen: {
    terrain: ["Snow", "Ice", "Stone"],
    objects: ["Chest", "Pine", "Crystal"]
  }
};

let mode = "Terrain"; // Terrain | Objects | Eraser
let biome = "Overworld";
let selected = "Grass";

// Two layers (store tile keys)
let terrain = makeGrid(GRID.w, GRID.h, "Grass");
let objects = makeGrid(GRID.w, GRID.h, null);

// --- DOM
const statusEl = document.getElementById("status");
const paletteEl = document.getElementById("palette");
const paletteTitleEl = document.getElementById("paletteTitle");
const mapCanvas = document.getElementById("map");
/**  {CanvasRenderingContext2D|null} */
let ctx = null;

function get2dContext(canvas){
  // iOS Safari can be picky about context options; fall back safely.
  try{
    return canvas.getContext("2d", { alpha: false }) || canvas.getContext("2d");
  }catch(_e){
    try{ return canvas.getContext("2d"); }catch(_e2){ return null; }
  }
}

const btnTerrain = document.getElementById("modeTerrain");
const btnObjects = document.getElementById("modeObjects");
const btnEraser  = document.getElementById("modeEraser");
const btnSave    = document.getElementById("btnSave");
const btnLoad    = document.getElementById("btnLoad");
const btnExport  = document.getElementById("btnExport");
const btnImport  = document.getElementById("btnImport");
const btnClear   = document.getElementById("btnClear");

// --- “Updated ALTTP” tiles: generate small pixel tiles and upscale
const TILE_PX = 16; // internal tile resolution
const tileCache = new Map(); // key -> canvas (16x16)

function makeGrid(w,h,fill){
  const a = new Array(h);
  for(let y=0;y<h;y++){
    a[y]=new Array(w);
    for(let x=0;x<w;x++) a[y][x]=fill;
  }
  return a;
}

function rand(seed){
  // deterministic-ish hash RNG from coords
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function px(ctx,x,y,c){ ctx.fillStyle=c; ctx.fillRect(x,y,1,1); }

function tileCanvas(){
  const c = document.createElement("canvas");
  c.width = TILE_PX; c.height = TILE_PX;
  return c;
}

function getTile(key){
  if(tileCache.has(key)) return tileCache.get(key);
  const c = tileCanvas();
  const t = c.getContext("2d");

  // Base palettes (slightly modernized)
  const P = {
    Grass: ["#2f7f3b","#2a6f35","#3a9a49","#23612d"],
    Dirt:  ["#7a4d2a","#6a4224","#8c5a30","#5b361e"],
    Stone: ["#6b7078","#5f646b","#7b8087","#4c5056"],
    Moss:  ["#4f7f3a","#3f6830","#5a8e43","#2f4f25"],
    Snow:  ["#d8e3ea","#cdd8df","#e7f1f7","#bfcbd3"],
    Ice:   ["#86c6d9","#6fb1c6","#9ad8e8","#4f8ea3"],

    // Objects (simple icons that read “ALTTP-ish”)
    Chest: ["#7b4d2a","#5b361e","#c8a23a","#2b2b2b"],
    Tree:  ["#2f7f3b","#1f5f2a","#5b361e","#0b0b0b"],
    Rock:  ["#6b7078","#4c5056","#9aa1ab","#0b0b0b"],
    Pillar:["#6b7078","#4c5056","#c8a23a","#0b0b0b"],
    Rubble:["#6b7078","#4c5056","#7b8087","#0b0b0b"],
    Pine:  ["#2a6f35","#1f5f2a","#5b361e","#0b0b0b"],
    Crystal:["#86c6d9","#9ad8e8","#c8a23a","#0b0b0b"]
  };

  // helper: noisy fill
  function noisyFill(cols, seedBase){
    for(let y=0;y<TILE_PX;y++){
      for(let x=0;x<TILE_PX;x++){
        const r = rand(seedBase + x*131 + y*977);
        const idx = r<0.55?0:r<0.78?1:r<0.93?2:3;
        px(t,x,y,cols[idx]);
      }
    }
  }

  // helper: bevel border (ALTTP-ish)
  function bevel(){
    // outer dark border
    t.fillStyle = "rgba(0,0,0,.55)";
    t.fillRect(0,0,TILE_PX,1);
    t.fillRect(0,0,1,TILE_PX);
    t.fillRect(0,TILE_PX-1,TILE_PX,1);
    t.fillRect(TILE_PX-1,0,1,TILE_PX);
    // inner light top/left
    t.fillStyle = "rgba(255,255,255,.14)";
    t.fillRect(1,1,TILE_PX-2,1);
    t.fillRect(1,1,1,TILE_PX-2);
    // inner dark bottom/right
    t.fillStyle = "rgba(0,0,0,.28)";
    t.fillRect(1,TILE_PX-2,TILE_PX-2,1);
    t.fillRect(TILE_PX-2,1,1,TILE_PX-2);
  }

  if(P[key]){
    noisyFill(P[key], hashKey(key));
    bevel();

    // object overlays
    if(isObject(key)){
      drawObjectGlyph(t, key);
    }
  } else {
    // fallback
    t.fillStyle="#333"; t.fillRect(0,0,TILE_PX,TILE_PX);
    bevel();
  }

  tileCache.set(key,c);
  return c;
}

function hashKey(s){
  let h=2166136261;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h>>>0;
}

function isObject(k){
  return ["Chest","Tree","Rock","Pillar","Rubble","Pine","Crystal"].includes(k);
}

function drawObjectGlyph(t, key){
  // More "16-bit" looking micro-sprites (still 16x16, but with outline + shading).
  // Goal: read like ALTTP objects, not emoji/8-bit blobs.
  function p(x,y,c){ t.fillStyle=c; t.fillRect(x,y,1,1); }
  function rect(x0,y0,x1,y1,c){
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) p(x,y,c);
  }
  function outline(x0,y0,x1,y1,oc){
    for(let x=x0;x<=x1;x++){ p(x,y0,oc); p(x,y1,oc); }
    for(let y=y0;y<=y1;y++){ p(x0,y,oc); p(x1,y,oc); }
  }

  const OUT = "#0d0d0f"; // ink outline

  if(key==="Chest"){
    // Chest with lid, banding, lock, and highlight (ALTTP-ish).
    const wD="#4b2a12", wM="#6a3c1c", wL="#8a5a2b";
    const mM="#c8a23a", mD="#8b6f20", mH="#dfcf8a";
    // Lid
    rect(4,5,11,8,wM);
    rect(5,6,10,6,wL);            // highlight strip
    rect(4,8,11,8,wD);            // lid shadow edge
    // Body
    rect(5,9,10,13,wM);
    rect(6,10,9,10,wL);           // front highlight
    rect(5,13,10,13,wD);          // base shadow
    // Metal bands
    rect(5,11,10,11,mM);
    rect(5,12,10,12,mD);
    // Lock plate
    rect(7,10,8,12,mM);
    rect(7,11,8,11,mH);
    p(7,12,OUT); p(8,12,OUT);
    // Outline (slightly irregular to feel sprite-like)
    outline(4,5,11,13,OUT);
    p(4,9,OUT); p(11,9,OUT);
    // Rounded lid corners
    p(4,5,OUT); p(11,5,OUT);
    p(4,6,OUT); p(11,6,OUT);
  }

  if(key==="Tree"){
    // Broadleaf tree: round canopy with 3 shades + trunk.
    const gD="#1f5a2b", gM="#2f7f3b", gL="#45a854";
    const barkD="#4b2a12", barkM="#6a3c1c";
    // Canopy blob (hand-tuned)
    const canopy = [
      [6,3,9,3],[5,4,10,4],[4,5,11,5],
      [4,6,11,6],[4,7,11,7],[5,8,10,8],[6,9,9,9]
    ];
    for(const [x0,y0,x1,y1] of canopy) rect(x0,y0,x1,y1,gM);
    // Shadows (lower-right)
    rect(9,6,11,7,gD); rect(8,8,10,9,gD);
    // Highlights (upper-left)
    rect(4,5,6,6,gL); rect(5,4,7,4,gL);
    // Outline canopy
    for(let y=3;y<=9;y++){
      for(let x=3;x<=12;x++){
        // outline if pixel is canopy and neighbor is empty
        const isFill = (x>=4 && x<=11 && (
          (y==3 && x>=6 && x<=9) ||
          (y==4 && x>=5 && x<=10) ||
          (y==5 && x>=4 && x<=11) ||
          (y==6 && x>=4 && x<=11) ||
          (y==7 && x>=4 && x<=11) ||
          (y==8 && x>=5 && x<=10) ||
          (y==9 && x>=6 && x<=9)
        ));
        if(!isFill) continue;
        const n = (dx,dy)=>{
          const xx=x+dx, yy=y+dy;
          return (xx>=4 && xx<=11 && (
            (yy==3 && xx>=6 && xx<=9) ||
            (yy==4 && xx>=5 && xx<=10) ||
            (yy==5 && xx>=4 && xx<=11) ||
            (yy==6 && xx>=4 && xx<=11) ||
            (yy==7 && xx>=4 && xx<=11) ||
            (yy==8 && xx>=5 && xx<=10) ||
            (yy==9 && xx>=6 && xx<=9)
          ));
        };
        if(!n(1,0)||!n(-1,0)||!n(0,1)||!n(0,-1)) p(x,y,OUT);
      }
    }
    // Trunk
    rect(7,10,8,13,barkM);
    rect(7,12,8,13,barkD);
    p(7,11,"#8a5a2b"); // tiny highlight
    // Outline trunk base
    p(6,13,OUT); p(9,13,OUT);
  }

  if(key==="Pine"){
    // Conifer: stacked triangles, shaded.
    const gD="#1b4e25", gM="#2a6f35", gL="#3a9246";
    const barkD="#4b2a12", barkM="#6a3c1c";
    // Layers
    rect(7,3,8,3,gL);
    rect(6,4,9,4,gM); rect(7,4,7,4,gL);
    rect(5,5,10,5,gM); rect(6,5,7,5,gL);
    rect(4,6,11,6,gM); rect(5,6,7,6,gL);
    rect(5,7,10,7,gM);
    rect(6,8,9,8,gD);
    // Outline edges
    for(const [x,y] of [[7,3],[6,4],[9,4],[5,5],[10,5],[4,6],[11,6],[5,7],[10,7],[6,8],[9,8]]) p(x,y,OUT);
    // Trunk
    rect(7,10,8,13,barkM);
    rect(7,12,8,13,barkD);
    p(7,11,"#8a5a2b");
  }

  if(key==="Rock"){
    // Irregular rock with highlight and crack.
    const rD="#4f545a", rM="#6a7078", rL="#8b929c";
    // Shape
    rect(5,9,10,12,rM);
    rect(6,8,10,9,rM);
    rect(6,7,9,8,rM);
    rect(6,12,9,12,rD);
    rect(9,10,10,12,rD); // shadow side
    rect(6,7,7,8,rL); rect(6,8,7,9,rL); // highlight
    // Crack
    p(8,9,OUT); p(7,10,OUT); p(8,11,OUT);
    // Outline
    for(const [x,y] of [[6,7],[9,7],[5,9],[10,8],[10,9],[11,10],[10,12],[5,12],[4,10],[5,8]]) p(x,y,OUT);
  }

  if(key==="Pillar"){
    // Stone pillar/obelisk-like marker.
    const sD="#525960", sM="#6e757d", sL="#8c939c";
    rect(7,5,8,13,sM);
    rect(7,5,7,13,sL);         // left highlight
    rect(8,7,8,13,sD);         // right shadow
    rect(6,5,9,6,sM);          // cap
    rect(6,5,8,5,sL);
    outline(6,5,9,13,OUT);
    // tiny rune
    p(7,9,"#2b2f33"); p(8,10,"#2b2f33");
  }

  if(key==="Rubble"){
    // Small cluster of stones.
    const sD="#4f545a", sM="#6a7078", sL="#8b929c";
    const stones = [
      {x:5,y:11,w:3,h:2},{x:9,y:12,w:2,h:2},{x:7,y:9,w:2,h:2},{x:10,y:10,w:2,h:2}
    ];
    for(const st of stones){
      rect(st.x,st.y,st.x+st.w-1,st.y+st.h-1,sM);
      rect(st.x,st.y,st.x+1,st.y,sL);
      rect(st.x+st.w-1,st.y,st.x+st.w-1,st.y+st.h-1,sD);
      outline(st.x,st.y,st.x+st.w-1,st.y+st.h-1,OUT);
    }
  }

  if(key==="Crystal"){
    // Faceted crystal with highlight.
    const cD="#4aa6c2", cM="#72c4db", cL="#a8e6f3";
    const base="#c8a23a";
    // Main shard
    rect(7,4,8,10,cM);
    rect(6,6,6,9,cM); rect(9,6,9,9,cM);
    rect(7,5,7,9,cL); // highlight ridge
    rect(8,7,8,10,cD); // shadow ridge
    // Facet tips
    p(7,3,cL); p(8,3,cM);
    p(6,5,cM); p(9,5,cD);
    // Outline
    for(const [x,y] of [[7,3],[8,3],[6,5],[9,5],[6,9],[9,9],[7,10],[8,10],[7,11],[8,11]]) p(x,y,OUT);
    // Base/stand
    rect(7,12,8,12,base);
    p(7,13,OUT); p(8,13,OUT);
  }
}

// --- Rendering setup
let tileSizeCSS = 24; // will be computed from canvas size
let painting = false;
let lastCell = null;

function resizeCanvas(){
  if(!mapCanvas) return;
  if(!ctx) ctx = get2dContext(mapCanvas);
  if(!ctx){
    statusEl.textContent = "Canvas error (2D context unavailable)";
    return;
  }

  // Make the canvas sharp on retina and fit container width while preserving square.
  const wrap = mapCanvas.parentElement;
  const maxPx = 520;
  const cssWidth = Math.min((wrap && wrap.clientWidth ? wrap.clientWidth : window.innerWidth) * 1.0, maxPx);
  const cssHeight = cssWidth; // square
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

  mapCanvas.style.width = cssWidth + "px";
  mapCanvas.style.height = cssHeight + "px";

  mapCanvas.width = Math.round(cssWidth * dpr);
  mapCanvas.height = Math.round(cssHeight * dpr);

  ctx.imageSmoothingEnabled = false;

  tileSizeCSS = cssWidth / GRID.w;
  render();
}

function updateStatus(){
  statusEl.textContent = `${mode} • ${biome} • ${selected ?? "None"}`;
}

function setMode(m){
  mode = m;
  btnTerrain.classList.toggle("active", mode==="Terrain");
  btnObjects.classList.toggle("active", mode==="Objects");
  btnEraser.classList.toggle("active", mode==="Eraser");

  // palette switches between terrain and objects when you change mode
  if(mode === "Objects"){
    paletteTitleEl.textContent = "Objects";
    selected = BIOMES[biome].objects[0] ?? null;
  } else {
    paletteTitleEl.textContent = "Tiles";
    selected = BIOMES[biome].terrain[0] ?? null;
  }
  buildPalette();
  updateStatus();
  render();
}

function setBiome(b){
  biome = b;
  document.querySelectorAll(".btn.biome").forEach(el=>{
    el.classList.toggle("active", el.dataset.biome===b);
  });

  // Ensure selected remains valid
  if(mode==="Objects"){
    if(!BIOMES[biome].objects.includes(selected)){
      selected = BIOMES[biome].objects[0] ?? null;
    }
  } else {
    if(!BIOMES[biome].terrain.includes(selected)){
      selected = BIOMES[biome].terrain[0] ?? null;
    }
  }
  buildPalette();
  updateStatus();
  render();
}

function buildPalette(){
  paletteEl.innerHTML = "";
  const keys = (mode==="Objects") ? BIOMES[biome].objects : BIOMES[biome].terrain;

  keys.forEach(k=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tilebtn" + (k===selected ? " active" : "");
    b.dataset.key = k;

    const mini = document.createElement("canvas");
    mini.width = TILE_PX; mini.height = TILE_PX;
    const mctx = mini.getContext("2d");
    mctx.imageSmoothingEnabled = false;
    mctx.drawImage(getTile(k), 0,0);

    const lab = document.createElement("div");
    lab.className = "label";
    lab.textContent = k;

    b.appendChild(mini);
    b.appendChild(lab);

    b.addEventListener("click", ()=>{
      selected = k;
      paletteEl.querySelectorAll(".tilebtn").forEach(x=>x.classList.toggle("active", x.dataset.key===k));
      updateStatus();
    });

    paletteEl.appendChild(b);
  });
}

function cellFromEvent(e){
  const rect = mapCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  const cx = Math.floor(x * GRID.w);
  const cy = Math.floor(y * GRID.h);
  if(cx<0||cy<0||cx>=GRID.w||cy>=GRID.h) return null;
  return {x:cx,y:cy};
}

function applyAt(cell){
  if(!cell) return;
  if(lastCell && lastCell.x===cell.x && lastCell.y===cell.y) return;
  lastCell = cell;

  if(mode==="Eraser"){
    // erase active layer: if objects mode last used? We'll erase objects if any, else terrain.
    // But eraser should erase the layer you were on before selecting Eraser.
    // We'll track lastNonEraserMode via selectedLayer.
    if(selectedLayer==="Objects"){
      objects[cell.y][cell.x]=null;
    } else {
      terrain[cell.y][cell.x]=BIOMES[biome].terrain[0] ?? "Grass";
    }
  } else if(mode==="Objects"){
    objects[cell.y][cell.x]=selected;
  } else {
    terrain[cell.y][cell.x]=selected;
  }

  render();
}

let selectedLayer = "Terrain"; // remembers last non-eraser layer
function rememberLayer(){
  if(mode==="Terrain") selectedLayer="Terrain";
  if(mode==="Objects") selectedLayer="Objects";
}

function render(){
  if(!ctx) return;
  const w = mapCanvas.width, h = mapCanvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(0,0,w,h);

  const dpr = mapCanvas.width / mapCanvas.getBoundingClientRect().width;
  const tileW = Math.floor((mapCanvas.getBoundingClientRect().width / GRID.w) * dpr);
  const tileH = tileW;

  // Draw terrain first
  for(let y=0;y<GRID.h;y++){
    for(let x=0;x<GRID.w;x++){
      const k = terrain[y][x] ?? "Grass";
      drawTile(k, x*tileW, y*tileH, tileW, tileH);
    }
  }

  // Draw objects on top (small sprite-like)
  for(let y=0;y<GRID.h;y++){
    for(let x=0;x<GRID.w;x++){
      const k = objects[y][x];
      if(!k) continue;

      // draw underlying object-tile as transparent sprite on top of terrain:
      // Use the 16x16 tile but scale down a touch to feel like a placed object.
      const tile = getTile(k);
      const pad = Math.round(tileW * 0.10);
      ctx.drawImage(tile, x*tileW + pad, y*tileH + pad, tileW - pad*2, tileH - pad*2);

      // tiny shadow
      ctx.fillStyle = "rgba(0,0,0,.20)";
      ctx.fillRect(x*tileW + pad, y*tileH + tileH - pad - 2, tileW - pad*2, 2);
    }
  }

  // Grid lines (subtle ALTTP-like: alternating strength)
  for(let y=0;y<=GRID.h;y++){
    const yy = y*tileH;
    ctx.fillStyle = (y%2===0) ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.25)";
    ctx.fillRect(0, yy, w, 1);
  }
  for(let x=0;x<=GRID.w;x++){
    const xx = x*tileW;
    ctx.fillStyle = (x%2===0) ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.25)";
    ctx.fillRect(xx, 0, 1, h);
  }

  // Selection cursor (shows last touched cell)
  if(lastCell){
    const x = lastCell.x*tileW, y = lastCell.y*tileH;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(200,162,58,.95)";
    ctx.strokeRect(x+1,y+1,tileW-2,tileH-2);
    ctx.strokeStyle = "rgba(0,0,0,.65)";
    ctx.strokeRect(x+3,y+3,tileW-6,tileH-6);
  }
}

function drawTile(key, dx, dy, dw, dh){
  const tile = getTile(key);
  ctx.drawImage(tile, dx, dy, dw, dh);

  // Slight depth (top highlight / bottom shadow) to read like ALTTP tiles
  ctx.fillStyle = "rgba(255,255,255,.05)";
  ctx.fillRect(dx+1, dy+1, dw-2, 1);
  ctx.fillStyle = "rgba(0,0,0,.30)";
  ctx.fillRect(dx+1, dy+dh-2, dw-2, 1);
}

// --- Save / Load / Export / Import
function snapshot(){
  return {
    v: 4,
    w: GRID.w,
    h: GRID.h,
    biome,
    terrain,
    objects
  };
}

function applySnapshot(data){
  if(!data || !data.terrain) throw new Error("Invalid data");
  biome = data.biome || "Overworld";
  terrain = data.terrain;
  objects = data.objects || makeGrid(GRID.w, GRID.h, null);

  // Safety: ensure size matches (simple clamp/resize)
  terrain = normalizeGrid(terrain, GRID.w, GRID.h, "Grass");
  objects = normalizeGrid(objects, GRID.w, GRID.h, null);

  // reflect biome UI
  document.querySelectorAll(".btn.biome").forEach(el=>{
    el.classList.toggle("active", el.dataset.biome===biome);
  });

  // reset mode selection validity
  if(mode==="Objects"){
    selected = BIOMES[biome].objects[0] ?? null;
  } else {
    selected = BIOMES[biome].terrain[0] ?? null;
  }

  buildPalette();
  updateStatus();
  render();
}

function normalizeGrid(g,w,h,fill){
  const out = makeGrid(w,h,fill);
  for(let y=0;y<Math.min(h,g.length);y++){
    for(let x=0;x<Math.min(w,g[y].length);x++){
      out[y][x]=g[y][x];
    }
  }
  return out;
}

function saveLocal(){
  const data = snapshot();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadLocal(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return null;
  return JSON.parse(raw);
}

async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch(e){
    return false;
  }
}

// --- Events
btnTerrain.addEventListener("click", ()=>{ rememberLayer(); setMode("Terrain"); });
btnObjects.addEventListener("click", ()=>{ rememberLayer(); setMode("Objects"); });
btnEraser.addEventListener("click", ()=>{
  rememberLayer();
  mode = "Eraser";
  btnTerrain.classList.remove("active");
  btnObjects.classList.remove("active");
  btnEraser.classList.add("active");
  paletteTitleEl.textContent = "Eraser";
  // palette remains as last layer's palette; we keep selected unchanged for status
  updateStatus();
});

document.querySelectorAll(".btn.biome").forEach(el=>{
  el.addEventListener("click", ()=> setBiome(el.dataset.biome));
});

btnSave.addEventListener("click", ()=>{
  saveLocal();
  flashStatus("Saved ✓");
});

btnLoad.addEventListener("click", ()=>{
  const data = loadLocal();
  if(!data){
    flashStatus("No saved map");
    return;
  }
  try{
    applySnapshot(data);
    flashStatus("Loaded ✓");
  }catch(e){
    flashStatus("Load failed");
  }
});

btnExport.addEventListener("click", async ()=>{
  const json = JSON.stringify(snapshot());
  const ok = await copyToClipboard(json);
  if(ok){
    flashStatus("Export copied ✓");
  } else {
    prompt("Copy your map JSON:", json);
  }
});

btnImport.addEventListener("click", ()=>{
  const raw = prompt("Paste map JSON to import:");
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    applySnapshot(data);
    saveLocal();
    flashStatus("Imported ✓");
  }catch(e){
    alert("Import failed: invalid JSON");
  }
});

btnClear.addEventListener("click", ()=>{
  if(!confirm("Clear the map? (terrain resets, objects cleared)")) return;
  terrain = makeGrid(GRID.w, GRID.h, BIOMES[biome].terrain[0] ?? "Grass");
  objects = makeGrid(GRID.w, GRID.h, null);
  lastCell = null;
  render();
  saveLocal();
  flashStatus("Cleared");
});

// Painting (pointer events)
mapCanvas.addEventListener("pointerdown", (e)=>{
  mapCanvas.setPointerCapture(e.pointerId);
  painting = true;
  lastCell = null;
  const cell = cellFromEvent(e);
  applyAt(cell);
});
mapCanvas.addEventListener("pointermove", (e)=>{
  if(!painting) return;
  const cell = cellFromEvent(e);
  applyAt(cell);
});
mapCanvas.addEventListener("pointerup", ()=>{
  painting = false;
  lastCell = null;
  render();
});
mapCanvas.addEventListener("pointercancel", ()=>{
  painting = false;
  lastCell = null;
  render();
});

function flashStatus(msg){
  const prev = statusEl.textContent;
  statusEl.textContent = msg;
  statusEl.style.color = "#f2d37a";
  setTimeout(()=>{
    updateStatus();
    statusEl.style.color = "";
  }, 650);
}

// Init
function init(){
  try{
    ctx = get2dContext(mapCanvas);
    buildPalette();
    updateStatus();
    resizeCanvas();

    const saved = loadLocal();
    if(saved){
      try{ applySnapshot(saved); }catch(_e){}
    }
  }catch(e){
    console.error(e);
    if(statusEl){
      statusEl.textContent = "Init error: " + ((e && e.message) ? e.message : e);
      statusEl.style.color = "#f2d37a";
    }
  }
}
window.addEventListener("resize", ()=>{ resizeCanvas(); });
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

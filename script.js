
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
const ctx = mapCanvas.getContext("2d", { alpha: false });

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
  // very small pixel icons (so it reads like a sprite on top of terrain)
  // Use only a few pixels so it feels “tile-placed”, not big modern icon.
  function p(x,y,c){ t.fillStyle=c; t.fillRect(x,y,1,1); }
  const mid = 8;

  if(key==="Chest"){
    const wood="#5b361e", wood2="#7b4d2a", gold="#c8a23a", ink="#111";
    // base box
    for(let y=9;y<=13;y++) for(let x=4;x<=11;x++) p(x,y, (y===9?wood2:wood));
    // lid
    for(let y=6;y<=8;y++) for(let x=4;x<=11;x++) p(x,y, wood2);
    // lock
    p(7,10,gold); p(8,10,gold); p(7,11,gold); p(8,11,gold);
    p(7,12,ink); p(8,12,ink);
  }

  if(key==="Tree" || key==="Pine"){
    const leaf = key==="Pine" ? "#1f5f2a" : "#2f7f3b";
    const leaf2= key==="Pine" ? "#2a6f35" : "#3a9a49";
    const bark = "#5b361e";
    // trunk
    for(let y=11;y<=13;y++) for(let x=7;x<=8;x++) p(x,y,bark);
    // crown
    const points = key==="Pine"
      ? [[7,4],[6,5],[8,5],[5,6],[9,6],[6,7],[8,7],[7,8]]
      : [[7,5],[6,6],[8,6],[5,7],[9,7],[6,8],[8,8],[7,9]];
    for(const [x,y] of points) p(x,y,leaf2);
    // fill
    for(let y=6;y<=10;y++){
      for(let x=5;x<=9;x++){
        if(rand(hashKey(key)+x*41+y*97) > 0.35) p(x,y,leaf);
      }
    }
  }

  if(key==="Rock" || key==="Rubble" || key==="Pillar"){
    const s1="#6b7078", s2="#7b8087", s3="#4c5056";
    if(key==="Pillar"){
      for(let y=5;y<=13;y++) for(let x=7;x<=9;x++) p(x,y,s1);
      for(let y=5;y<=13;y++) p(7,y,s2);
      for(let y=5;y<=13;y++) p(9,y,s3);
      p(6,5,s2); p(10,5,s3); p(6,13,s2); p(10,13,s3);
    } else {
      const pts=[[6,9],[7,8],[8,8],[9,9],[9,10],[8,11],[7,11],[6,10]];
      for(const [x,y] of pts) p(x,y,s1);
      for(let y=9;y<=11;y++) for(let x=6;x<=9;x++) if(rand(x*17+y*31)>0.35) p(x,y,rand(x*9+y*13)>0.6?s2:s3);
    }
    if(key==="Rubble"){
      p(4,12,s3); p(5,12,s1); p(4,13,s1);
      p(11,6,s3); p(12,6,s1); p(12,7,s2);
    }
  }

  if(key==="Crystal"){
    const c1="#86c6d9", c2="#9ad8e8", gold="#c8a23a", ink="#111";
    const pts=[[8,4],[7,5],[9,5],[6,6],[10,6],[7,7],[9,7],[8,8],[8,9]];
    for(const [x,y] of pts) p(x,y,c1);
    p(8,5,c2); p(8,6,c2); p(8,7,c2);
    p(7,6,c2); p(9,6,c2);
    p(8,10,gold); p(8,11,ink);
  }
}

// --- Rendering setup
let tileSizeCSS = 24; // will be computed from canvas size
let painting = false;
let lastCell = null;

function resizeCanvas(){
  // Make the canvas sharp on retina and fit container width while preserving square.
  const cssWidth = Math.min(window.innerWidth * 0.92, 520);
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
  buildPalette();
  updateStatus();
  resizeCanvas();

  // attempt load saved
  const saved = loadLocal();
  if(saved){
    try{ applySnapshot(saved); }catch(e){}
  }
}
window.addEventListener("resize", ()=>{ resizeCanvas(); });
init();

(() => {
  "use strict";

  // ====== CONFIG ======
  const TILE = 32;             // tileset tile size (px)
  const TS_COLS = 8;           // tileset columns (256px / 32px)
  const MAP_COLS = 16;
  const MAP_ROWS = 12;

  // ====== TILE IDS ======
  const TERRAIN = {
    Grass: 0,
    Dirt:  1,
    Stone: 2,
    Moss:  3,
    Snow:  4,
    Ice:   5,
  };

  // NOTE: IDs here are "object IDs" (selection + save/load), not necessarily equal to
  // the tileset tile indices used for rendering multi-tile stamps.
  const OBJECTS = {
    // Single-tile objects (their id == tileset tile index)
    Tree:   16,
    Pine:   17,
    Rock:   18,
    Chest:  19,
    Pillar: 20,
    Rubble: 21,
    Crystal:22,

    // Buildings / props (now MULTI-TILE stamps)
    House:    23,
    Shop:     24,
    Fountain: 25,
    Cabin:    26,
    Sign:     27,

    // Wildlife (single tile for now)
    Deer: 28,
    Wolf: 29,
    Boar: 30,
    Bird: 31,
    Bear: 32,
  };

  const BIOMES = {
    overworld: { name: "Overworld", tiles: [TERRAIN.Grass, TERRAIN.Dirt, TERRAIN.Stone], defaultTile: TERRAIN.Grass },
    ruins:     { name: "Ruins",     tiles: [TERRAIN.Stone, TERRAIN.Moss, TERRAIN.Dirt], defaultTile: TERRAIN.Stone },
    frozen:    { name: "Frozen",    tiles: [TERRAIN.Snow, TERRAIN.Ice, TERRAIN.Stone], defaultTile: TERRAIN.Snow  },
  };

  // ====== MULTI-TILE OBJECT STAMPS ======
  // Each stamp entry is a tileset tile index (row-major on the tileset).
  // Use -1 for transparent "no tile" cells.
  //
  // We placed new 2x2 building art into the tileset at indices:
  // House:    40,41 / 48,49
  // Shop:     42,43 / 50,51
  // Fountain: 44,45 / 52,53
  // Cabin:    46,47 / 54,55
  const OBJECT_DEFS = {
    // Single-tile objects: stamp is just the object's id
    [OBJECTS.Tree]:   { id: OBJECTS.Tree,   label: "Tree",   w: 1, h: 1, stamp: [[16]] },
    [OBJECTS.Pine]:   { id: OBJECTS.Pine,   label: "Pine",   w: 1, h: 1, stamp: [[17]] },
    [OBJECTS.Rock]:   { id: OBJECTS.Rock,   label: "Rock",   w: 1, h: 1, stamp: [[18]] },
    [OBJECTS.Chest]:  { id: OBJECTS.Chest,  label: "Chest",  w: 1, h: 1, stamp: [[19]] },
    [OBJECTS.Pillar]: { id: OBJECTS.Pillar, label: "Pillar", w: 1, h: 1, stamp: [[20]] },
    [OBJECTS.Rubble]: { id: OBJECTS.Rubble, label: "Rubble", w: 1, h: 1, stamp: [[21]] },
    [OBJECTS.Crystal]:{ id: OBJECTS.Crystal,label: "Crystal",w: 1, h: 1, stamp: [[22]] },

    // Multi-tile buildings (2x2 for now; framework supports up to 4x4)
    [OBJECTS.House]:    { id: OBJECTS.House,    label: "House",    w: 2, h: 2, stamp: [[40,41],[48,49]] },
    [OBJECTS.Shop]:     { id: OBJECTS.Shop,     label: "Shop",     w: 2, h: 2, stamp: [[42,43],[50,51]] },
    [OBJECTS.Fountain]: { id: OBJECTS.Fountain, label: "Fountain", w: 2, h: 2, stamp: [[44,45],[52,53]] },
    [OBJECTS.Cabin]:    { id: OBJECTS.Cabin,    label: "Cabin",    w: 2, h: 2, stamp: [[46,47],[54,55]] },

    // Sign is still single-tile for now
    [OBJECTS.Sign]:     { id: OBJECTS.Sign,     label: "Sign",     w: 1, h: 1, stamp: [[27]] },

    // Wildlife (single)
    [OBJECTS.Deer]: { id: OBJECTS.Deer, label: "Deer", w:1, h:1, stamp:[[28]] },
    [OBJECTS.Wolf]: { id: OBJECTS.Wolf, label: "Wolf", w:1, h:1, stamp:[[29]] },
    [OBJECTS.Boar]: { id: OBJECTS.Boar, label: "Boar", w:1, h:1, stamp:[[30]] },
    [OBJECTS.Bird]: { id: OBJECTS.Bird, label: "Bird", w:1, h:1, stamp:[[31]] },
    [OBJECTS.Bear]: { id: OBJECTS.Bear, label: "Bear", w:1, h:1, stamp:[[32]] },
  };

  const OBJECT_TILE_LIST = [
    { id: OBJECTS.Tree, label: "Tree" },
    { id: OBJECTS.Pine, label: "Pine" },
    { id: OBJECTS.Rock, label: "Rock" },
    { id: OBJECTS.Deer, label: "Deer" },
    { id: OBJECTS.Wolf, label: "Wolf" },
    { id: OBJECTS.Boar, label: "Boar" },
    { id: OBJECTS.Bird, label: "Bird" },
    { id: OBJECTS.Bear, label: "Bear" },
  ];

  const OBJECT_TILE_LIST_2 = [
    { id: OBJECTS.Chest, label: "Chest" },
    { id: OBJECTS.House, label: "House" },
    { id: OBJECTS.Shop, label: "Shop" },
    { id: OBJECTS.Fountain, label: "Fountain" },
    { id: OBJECTS.Cabin, label: "Cabin" },
    { id: OBJECTS.Sign, label: "Sign" },
    { id: OBJECTS.Pillar, label: "Pillar" },
    { id: OBJECTS.Rubble, label: "Rubble" },
    { id: OBJECTS.Crystal, label: "Crystal" },
  ];

  // ====== DOM ======
  const statusEl = document.getElementById("status");
  const paletteTitleEl = document.getElementById("paletteTitle");
  const paletteEl = document.getElementById("palette");
  const tipEl = document.getElementById("tip");

  const btnTerrain = document.getElementById("btnTerrain");
  const btnObjects = document.getElementById("btnObjects");
  const btnEraser  = document.getElementById("btnEraser");
  const btnSave    = document.getElementById("btnSave");
  const btnLoad    = document.getElementById("btnLoad");
  const btnExport  = document.getElementById("btnExport");
  const btnImport  = document.getElementById("btnImport");
  const btnClear   = document.getElementById("btnClear");

  const btnOverworld = document.getElementById("btnOverworld");
  const btnRuins     = document.getElementById("btnRuins");
  const btnFrozen    = document.getElementById("btnFrozen");

  const canvas = document.getElementById("mapCanvas");
  let ctx = null;

  const tilesetImg = document.getElementById("tilesetImg");

  // ====== STATE ======
  let mode = "terrain"; // "terrain" | "objects"
  let eraser = false;
  let biome = "overworld";

  let selectedTerrain = BIOMES[biome].defaultTile;
  let selectedObject = OBJECTS.Tree;

  // terrain: per-cell tile index
  const terrainLayer = new Int16Array(MAP_COLS * MAP_ROWS);

  // objects: list of instances {id, x, y}
  let objects = [];

  let lastCell = null;
  let isDown = false;
  let lastPaintKey = "";

  const STORAGE_KEY = "gr_world_v4c_layers_tileset";

  // ====== HELPERS ======
  const idx = (x,y) => y*MAP_COLS + x;

  function tileSrcRect(tileIndex){
    const sx = (tileIndex % TS_COLS) * TILE;
    const sy = Math.floor(tileIndex / TS_COLS) * TILE;
    return { sx, sy };
  }

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function setStatus(){
    const biomeName = BIOMES[biome].name;
    const modeLabel = eraser ? "Eraser" : (mode === "terrain" ? "Terrain" : "Objects");
    const selLabel = eraser ? "" : (mode === "terrain" ? terrainLabel(selectedTerrain) : objectLabel(selectedObject));
    const txt = selLabel ? `${modeLabel} • ${biomeName} • ${selLabel}` : `${modeLabel} • ${biomeName}`;
    statusEl.textContent = txt;
  }

  function terrainLabel(tileId){
    for(const [k,v] of Object.entries(TERRAIN)){
      if(v === tileId) return k;
    }
    return `Tile ${tileId}`;
  }

  function objectLabel(objId){
    return (OBJECT_DEFS[objId]?.label) || `Obj ${objId}`;
  }

  function setActiveButtons(){
    btnTerrain.classList.toggle("active", mode === "terrain" && !eraser);
    btnObjects.classList.toggle("active", mode === "objects" && !eraser);
    btnEraser.classList.toggle("active", eraser);

    btnOverworld.classList.toggle("active", biome === "overworld");
    btnRuins.classList.toggle("active", biome === "ruins");
    btnFrozen.classList.toggle("active", biome === "frozen");

    setStatus();
  }

  function ensureContext(){
    if(ctx) return true;
    // iOS Safari can be picky about 2D context options
    ctx = canvas.getContext("2d", { alpha: false });
    if(!ctx) ctx = canvas.getContext("2d");
    if(!ctx){
      statusEl.textContent = "Canvas init failed (iOS). Try refresh / cache-bust.";
      return false;
    }
    ctx.imageSmoothingEnabled = false;
    return true;
  }

  function sizeCanvas(){
    canvas.width = MAP_COLS * TILE;
    canvas.height = MAP_ROWS * TILE;
    redraw();
  }

  function drawTile(tileIndex, x, y){
    if(tileIndex == null || tileIndex < 0) return;
    const { sx, sy } = tileSrcRect(tileIndex);
    ctx.drawImage(tilesetImg, sx, sy, TILE, TILE, x*TILE, y*TILE, TILE, TILE);
  }

  function drawStamp(stamp, x, y){
    const h = stamp.length;
    const w = stamp[0].length;
    for(let dy=0; dy<h; dy++){
      for(let dx=0; dx<w; dx++){
        const t = stamp[dy][dx];
        if(t >= 0) drawTile(t, x+dx, y+dy);
      }
    }
  }

  function objectBounds(obj){
    const def = OBJECT_DEFS[obj.id];
    return { x: obj.x, y: obj.y, w: def?.w || 1, h: def?.h || 1 };
  }

  function findTopObjectAt(tx, ty){
    for(let i=objects.length-1; i>=0; i--){
      const o = objects[i];
      const b = objectBounds(o);
      if(tx >= b.x && tx < b.x+b.w && ty >= b.y && ty < b.y+b.h){
        return i;
      }
    }
    return -1;
  }

  // ====== RENDER ======
  function redraw(){
    if(!ensureContext()) return;
    if(!tilesetImg.complete) return;

    ctx.clearRect(0,0,canvas.width, canvas.height);

    // background
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0,0,canvas.width, canvas.height);

    // terrain
    for(let y=0;y<MAP_ROWS;y++){
      for(let x=0;x<MAP_COLS;x++){
        drawTile(terrainLayer[idx(x,y)], x, y);
      }
    }

    // objects (instances)
    for(const o of objects){
      const def = OBJECT_DEFS[o.id];
      if(!def) continue;
      drawStamp(def.stamp, o.x, o.y);
    }

    // gridlines (subtle ALTTP-ish)
    const w = MAP_COLS*TILE, h = MAP_ROWS*TILE;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;

    for(let gx=0; gx<=MAP_COLS; gx++){
      ctx.globalAlpha = (gx%2===0) ? 0.30 : 0.18;
      ctx.beginPath();
      ctx.moveTo(gx*TILE+0.5, 0);
      ctx.lineTo(gx*TILE+0.5, h);
      ctx.stroke();
    }
    for(let gy=0; gy<=MAP_ROWS; gy++){
      ctx.globalAlpha = (gy%2===0) ? 0.30 : 0.18;
      ctx.beginPath();
      ctx.moveTo(0, gy*TILE+0.5);
      ctx.lineTo(w, gy*TILE+0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // cursor / preview
    if(lastCell){
      const {x,y} = lastCell;
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(201,164,65,0.95)";
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 6;

      if(mode === "objects" && !eraser){
        const def = OBJECT_DEFS[selectedObject];
        if(def){
          ctx.strokeRect(x*TILE+1, y*TILE+1, def.w*TILE-2, def.h*TILE-2);
        }else{
          ctx.strokeRect(x*TILE+1, y*TILE+1, TILE-2, TILE-2);
        }
      }else{
        ctx.strokeRect(x*TILE+1, y*TILE+1, TILE-2, TILE-2);
      }
      ctx.restore();
    }
  }

  // ====== PALETTE ======
  function buildPalette(){
    paletteEl.innerHTML = "";

    const makeBtn = ({id, label}, selected) => {
      const def = OBJECT_DEFS[id];

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tilebtn" + (selected ? " active" : "");
      btn.dataset.tileId = String(id);

      const c = document.createElement("canvas");
      c.className = "tilepreview";
      const pw = (def?.w || 1);
      const ph = (def?.h || 1);
      // Draw at native pixels; CSS will scale
      c.width = TILE * pw;
      c.height = TILE * ph;

      const cctx = c.getContext("2d");
      cctx.imageSmoothingEnabled = false;
      cctx.clearRect(0,0,c.width,c.height);

      if(mode === "objects"){
        // draw stamp preview
        const stamp = def?.stamp || [[id]];
        for(let dy=0; dy<stamp.length; dy++){
          for(let dx=0; dx<stamp[0].length; dx++){
            const t = stamp[dy][dx];
            if(t < 0) continue;
            const {sx,sy} = tileSrcRect(t);
            cctx.drawImage(tilesetImg, sx, sy, TILE, TILE, dx*TILE, dy*TILE, TILE, TILE);
          }
        }
      }else{
        const {sx,sy} = tileSrcRect(id);
        cctx.drawImage(tilesetImg, sx, sy, TILE, TILE, 0, 0, TILE, TILE);
      }

      const sp = document.createElement("div");
      sp.className = "label";
      sp.textContent = label;

      btn.appendChild(c);
      btn.appendChild(sp);

      btn.addEventListener("click", () => {
        if(mode === "objects"){
          selectedObject = id;
        }else{
          selectedTerrain = id;
        }
        eraser = false;
        setActiveButtons();
        buildPalette();
        redraw();
      });

      return btn;
    };

    if(mode === "objects"){
      paletteTitleEl.textContent = "Objects";
      const list = [...OBJECT_TILE_LIST, ...OBJECT_TILE_LIST_2];
      for(const o of list){
        paletteEl.appendChild(makeBtn(o, o.id === selectedObject));
      }
    }else{
      paletteTitleEl.textContent = "Tiles";
      const tiles = BIOMES[biome].tiles;
      for(const t of tiles){
        paletteEl.appendChild(makeBtn({id: t, label: terrainLabel(t)}, t === selectedTerrain));
      }
    }
  }

  // ====== INPUT ======
  function eventToTile(ev){
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    const px = (ev.clientX - r.left) * sx;
    const py = (ev.clientY - r.top)  * sy;
    const tx = clamp(Math.floor(px / TILE), 0, MAP_COLS-1);
    const ty = clamp(Math.floor(py / TILE), 0, MAP_ROWS-1);
    return { tx, ty };
  }

  function applyAt(tx, ty){
    lastCell = {x: tx, y: ty};

    // prevent spamming same cell while dragging
    const key = `${mode}|${eraser?"E":"P"}|${biome}|${tx},${ty}|${mode==="terrain"?selectedTerrain:selectedObject}`;
    if(key === lastPaintKey) { redraw(); return; }
    lastPaintKey = key;

    if(eraser){
      if(mode === "terrain"){
        terrainLayer[idx(tx,ty)] = BIOMES[biome].defaultTile;
      }else{
        const i = findTopObjectAt(tx,ty);
        if(i >= 0) objects.splice(i,1);
      }
      redraw();
      return;
    }

    if(mode === "terrain"){
      terrainLayer[idx(tx,ty)] = selectedTerrain;
      redraw();
      return;
    }

    // objects
    const def = OBJECT_DEFS[selectedObject];
    const w = def?.w || 1;
    const h = def?.h || 1;

    // Clamp placement so larger objects always fit
    const ax = clamp(tx, 0, MAP_COLS - w);
    const ay = clamp(ty, 0, MAP_ROWS - h);

    // If this would overlap an existing object, remove the topmost one at the anchor cell first
    // (simple/clean behavior on mobile)
    const existing = findTopObjectAt(ax, ay);
    if(existing >= 0) objects.splice(existing, 1);

    objects.push({ id: selectedObject, x: ax, y: ay });
    redraw();
  }

  function onPointerDown(ev){
    if(!ensureContext()) return;
    ev.preventDefault();
    isDown = true;
    const {tx,ty} = eventToTile(ev);
    applyAt(tx,ty);
  }
  function onPointerMove(ev){
    if(!ensureContext()) return;
    const {tx,ty} = eventToTile(ev);
    lastCell = {x: tx, y: ty};
    if(isDown){
      ev.preventDefault();
      applyAt(tx,ty);
    }else{
      redraw();
    }
  }
  function onPointerUp(){
    isDown = false;
    lastPaintKey = "";
  }

  // ====== SAVE/LOAD ======
  function serialize(){
    return {
      v: 4,
      cols: MAP_COLS,
      rows: MAP_ROWS,
      biome,
      terrain: Array.from(terrainLayer),
      objects: objects.map(o => ({ id: o.id, x: o.x, y: o.y })),
    };
  }

  function applyData(data){
    if(!data || !Array.isArray(data.terrain)) throw new Error("bad data");
    biome = (data.biome && BIOMES[data.biome]) ? data.biome : "overworld";
    const t = data.terrain;
    for(let i=0;i<terrainLayer.length;i++){
      terrainLayer[i] = (typeof t[i] === "number") ? t[i] : BIOMES[biome].defaultTile;
    }
    objects = Array.isArray(data.objects) ? data.objects
      .filter(o => o && typeof o.id === "number" && typeof o.x === "number" && typeof o.y === "number")
      .map(o => ({ id: o.id, x: clamp(o.x,0,MAP_COLS-1), y: clamp(o.y,0,MAP_ROWS-1) }))
      : [];
    // ensure default selection remains valid
    selectedTerrain = BIOMES[biome].defaultTile;
    setActiveButtons();
    buildPalette();
    redraw();
  }

  function saveMap(){
    const data = serialize();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    alert("Saved ✅");
  }

  function loadMap(){
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){ alert("No save found yet."); return; }
    try{
      applyData(JSON.parse(raw));
      alert("Loaded ✅");
    }catch(e){
      alert("Load failed: " + (e?.message || "bad JSON"));
    }
  }

  async function exportMap(){
    const json = JSON.stringify(serialize());
    // try clipboard first
    try{
      await navigator.clipboard.writeText(json);
      alert("Exported ✅ (copied to clipboard)");
      return;
    }catch(_e){}
    prompt("Copy your map JSON:", json);
  }

  function importMap(){
    const txt = prompt("Paste map JSON to import:");
    if(!txt) return;
    try{
      const data = JSON.parse(txt);
      applyData(data);
      alert("Imported ✅");
    }catch(e){
      alert("Import failed: " + (e?.message || "bad JSON"));
    }
  }

  function clearMap(){
    terrainLayer.fill(BIOMES[biome].defaultTile);
    objects = [];
    lastCell = null;
    redraw();
  }

  // ====== WIRES ======
  function setMode(next){
    mode = next;
    eraser = false;
    setActiveButtons();
    buildPalette();
    redraw();
  }
  function setBiome(next){
    biome = next;
    selectedTerrain = BIOMES[biome].defaultTile;
    eraser = false;
    setActiveButtons();
    buildPalette();
    redraw();
  }

  btnTerrain.addEventListener("click", ()=> setMode("terrain"));
  btnObjects.addEventListener("click", ()=> setMode("objects"));
  btnEraser.addEventListener("click", ()=>{
    eraser = !eraser;
    setActiveButtons();
    redraw();
  });

  btnSave.addEventListener("click", saveMap);
  btnLoad.addEventListener("click", loadMap);
  btnExport.addEventListener("click", exportMap);
  btnImport.addEventListener("click", importMap);
  btnClear.addEventListener("click", ()=>{
    if(confirm("Clear map?")) clearMap();
  });

  btnOverworld.addEventListener("click", ()=> setBiome("overworld"));
  btnRuins.addEventListener("click", ()=> setBiome("ruins"));
  btnFrozen.addEventListener("click", ()=> setBiome("frozen"));

  // prevent page scrolling while interacting with canvas
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", onPointerDown, {passive:false});
  canvas.addEventListener("pointermove", onPointerMove, {passive:false});
  window.addEventListener("pointerup", onPointerUp);

  // ====== INIT ======
  function init(){
    // init terrain to default biome
    terrainLayer.fill(BIOMES[biome].defaultTile);

    // tileset load
    if(!tilesetImg.complete){
      tilesetImg.addEventListener("load", ()=>{
        sizeCanvas();
        setActiveButtons();
        buildPalette();
        setStatus();
        redraw();
      }, { once:true });
      tilesetImg.addEventListener("error", ()=>{
        statusEl.textContent = "tileset.png failed to load (check file name + cache).";
      }, { once:true });
    }else{
      sizeCanvas();
      setActiveButtons();
      buildPalette();
      setStatus();
      redraw();
    }

    tipEl.textContent = "Tip: drag to paint • buildings can be multi-tile (up to 4×4 later) • eraser removes the active layer";
  }

  init();
})();

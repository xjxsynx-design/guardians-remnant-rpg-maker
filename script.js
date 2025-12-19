(() => {
  "use strict";

  // ====== Config ======
  const TILE = 24;              // tileset tile size in pixels
  const TS_COLS = 8;            // tileset columns (matches tileset.png generation)
  const MAP_COLS = 16;
  const MAP_ROWS = 12;

  // Tileset indices (same as tileset.png)
  const TERRAIN = {
    Grass: 0,
    Dirt: 1,
    Stone: 2,
    Moss: 3,
    Snow: 4,
    Ice:  5,
  };

  const OBJECTS = {
    Tree:   16,
    Pine:   17,
    Rock:   18,
    Chest:  19,
    Pillar: 20,
    Rubble: 21,
    Crystal:22,
  };

  const BIOMES = {
    overworld: { name: "Overworld", tiles: [TERRAIN.Grass, TERRAIN.Dirt, TERRAIN.Stone], defaultTile: TERRAIN.Grass },
    ruins:     { name: "Ruins",     tiles: [TERRAIN.Stone, TERRAIN.Moss, TERRAIN.Dirt], defaultTile: TERRAIN.Stone },
    frozen:    { name: "Frozen",    tiles: [TERRAIN.Snow, TERRAIN.Ice, TERRAIN.Stone],  defaultTile: TERRAIN.Snow  },
  };

  const OBJECT_TILE_LIST = [
    { id: OBJECTS.Tree, label: "Tree" },
    { id: OBJECTS.Pine, label: "Pine" },
    { id: OBJECTS.Rock, label: "Rock" },
  ];
  const OBJECT_TILE_LIST_2 = [
    { id: OBJECTS.Chest, label: "Chest" },
    { id: OBJECTS.Pillar, label: "Pillar" },
    { id: OBJECTS.Rubble, label: "Rubble" },
    { id: OBJECTS.Crystal, label: "Crystal" },
  ];

  // ====== State ======
  let mode = "terrain";                // 'terrain' | 'objects' | 'eraser'
  let biome = "overworld";
  let selectedTerrain = BIOMES[biome].defaultTile;
  let selectedObject  = OBJECTS.Tree;
  let lastCell = null;                 // for cursor

  // layers
  let terrainLayer = new Array(MAP_COLS * MAP_ROWS).fill(BIOMES[biome].defaultTile);
  let objectLayer  = new Array(MAP_COLS * MAP_ROWS).fill(-1);

  // rendering
  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const paletteEl = document.getElementById("palette");
  const paletteTitle = document.getElementById("paletteTitle");

  const tilesetImg = document.getElementById("tilesetImg");

  // ====== Helpers ======
  const idx = (x, y) => y * MAP_COLS + x;

  function tileSrcRect(tileIndex){
    const sx = (tileIndex % TS_COLS) * TILE;
    const sy = Math.floor(tileIndex / TS_COLS) * TILE;
    return { sx, sy };
  }

  function setStatus(text){
    statusEl.textContent = text;
  }

  function currentSelectionLabel(){
    if(mode === "terrain" || mode === "eraser"){
      const name = Object.keys(TERRAIN).find(k => TERRAIN[k] === selectedTerrain) || "Tile";
      return `${cap(mode)} • ${BIOMES[biome].name} • ${name}`;
    }
    const oname = Object.keys(OBJECTS).find(k => OBJECTS[k] === selectedObject) || "Object";
    return `${cap(mode)} • ${BIOMES[biome].name} • ${oname}`;
  }

  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  function saveToLocal(){
    const payload = {
      v: 1,
      cols: MAP_COLS,
      rows: MAP_ROWS,
      biome,
      terrain: terrainLayer,
      objects: objectLayer,
    };
    localStorage.setItem("gr_world_v4c", JSON.stringify(payload));
  }

  function loadFromLocal(){
    const raw = localStorage.getItem("gr_world_v4c");
    if(!raw) return false;
    try{
      const data = JSON.parse(raw);
      if(!data || data.v !== 1) return false;
      if(data.cols !== MAP_COLS || data.rows !== MAP_ROWS) return false;
      biome = data.biome in BIOMES ? data.biome : "overworld";
      terrainLayer = Array.isArray(data.terrain) ? data.terrain.slice(0, MAP_COLS*MAP_ROWS) : terrainLayer;
      objectLayer  = Array.isArray(data.objects) ? data.objects.slice(0, MAP_COLS*MAP_ROWS) : objectLayer;
      // pad if short
      while(terrainLayer.length < MAP_COLS*MAP_ROWS) terrainLayer.push(BIOMES[biome].defaultTile);
      while(objectLayer.length < MAP_COLS*MAP_ROWS) objectLayer.push(-1);
      return true;
    }catch(_e){
      return false;
    }
  }

  async function exportJSON(){
    const payload = {
      v: 1,
      cols: MAP_COLS,
      rows: MAP_ROWS,
      biome,
      terrain: terrainLayer,
      objects: objectLayer,
    };
    const txt = JSON.stringify(payload);
    // try clipboard
    try{
      await navigator.clipboard.writeText(txt);
      alert("Export copied to clipboard ✅");
    }catch(_e){
      prompt("Copy this JSON:", txt);
    }
  }

  function importJSON(){
    const txt = prompt("Paste exported JSON:");
    if(!txt) return;
    try{
      const data = JSON.parse(txt);
      if(!data || data.v !== 1) throw new Error("Invalid version");
      if(data.cols !== MAP_COLS || data.rows !== MAP_ROWS) throw new Error("Map size mismatch");
      biome = data.biome in BIOMES ? data.biome : "overworld";
      terrainLayer = data.terrain.slice(0, MAP_COLS*MAP_ROWS);
      objectLayer  = data.objects.slice(0, MAP_COLS*MAP_ROWS);
      while(terrainLayer.length < MAP_COLS*MAP_ROWS) terrainLayer.push(BIOMES[biome].defaultTile);
      while(objectLayer.length < MAP_COLS*MAP_ROWS) objectLayer.push(-1);
      selectedTerrain = BIOMES[biome].defaultTile;
      setActiveButtons();
      buildPalette();
      redraw();
      alert("Imported ✅");
    }catch(e){
      alert("Import failed: " + (e?.message || "bad JSON"));
    }
  }

  function clearMap(){
    terrainLayer.fill(BIOMES[biome].defaultTile);
    objectLayer.fill(-1);
    lastCell = null;
    redraw();
  }

  // ====== UI ======
  function setActiveButtons(){
    // mode buttons
    document.querySelectorAll(".btn.mode").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
    // biome buttons
    document.querySelectorAll(".btn.biome").forEach(b => b.classList.toggle("active", b.dataset.biome === biome));
    setStatus(currentSelectionLabel());
  }

  function buildPalette(){
    paletteEl.innerHTML = "";

    const makeTileButton = (tileId, label, selected) => {
      const btn = document.createElement("button");
      btn.className = "tilebtn" + (selected ? " active" : "");
      btn.type = "button";
      btn.dataset.tileId = String(tileId);

      const c = document.createElement("canvas");
      c.className = "tilepreview";
      // draw at native TILE px then upscales via CSS
      c.width = TILE;
      c.height = TILE;
      const cctx = c.getContext("2d");
      cctx.imageSmoothingEnabled = false;
      const { sx, sy } = tileSrcRect(tileId);
      cctx.clearRect(0,0,TILE,TILE);
      cctx.drawImage(tilesetImg, sx, sy, TILE, TILE, 0, 0, TILE, TILE);

      const sp = document.createElement("div");
      sp.className = "label";
      sp.textContent = label;

      btn.appendChild(c);
      btn.appendChild(sp);

      btn.addEventListener("click", () => {
        if(mode === "terrain" || mode === "eraser"){
          selectedTerrain = tileId;
        }else{
          selectedObject = tileId;
        }
        // toggle active
        [...paletteEl.querySelectorAll(".tilebtn")].forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        setStatus(currentSelectionLabel());
      });

      return btn;
    };

    if(mode === "objects"){
      paletteTitle.textContent = "Objects";
      // 3 across looks best on mobile
      const list = [...OBJECT_TILE_LIST, ...OBJECT_TILE_LIST_2];
      for(const o of list){
        paletteEl.appendChild(makeTileButton(o.id, o.label, o.id === selectedObject));
      }
    }else{
      paletteTitle.textContent = "Tiles";
      // per-biome terrain
      const tiles = BIOMES[biome].tiles;
      const labels = Object.entries(TERRAIN).reduce((acc,[k,v]) => (acc[v]=k, acc), {});
      for(const t of tiles){
        paletteEl.appendChild(makeTileButton(t, labels[t] || "Tile", t === selectedTerrain));
      }
    }
  }

  // ====== Rendering ======
  function resizeCanvas(){
    // keep canvas pixel-perfect; fit within container
    const frame = canvas.parentElement;
    const maxW = frame.clientWidth - 4;
    const nativeW = MAP_COLS * TILE;
    const nativeH = MAP_ROWS * TILE;

    // if we have room, scale up by integer factor for clarity
    let scale = Math.floor(maxW / nativeW);
    if(scale < 1) scale = 1;
    // cap so it doesn't get absurdly huge
    scale = Math.min(scale, 2);

    const cssW = nativeW * scale;
    const cssH = nativeH * scale;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;

    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.imageSmoothingEnabled = false;

    redraw();
  }

  function drawTile(tileId, x, y){
    if(tileId === -1) return;
    const { sx, sy } = tileSrcRect(tileId);
    ctx.drawImage(tilesetImg, sx, sy, TILE, TILE, x*TILE, y*TILE, TILE, TILE);
  }

  function redraw(){
    if(!tilesetImg.complete) return;

    // clear
    ctx.clearRect(0,0, canvas.width, canvas.height);

    // background grid (subtle)
    const w = MAP_COLS*TILE, h=MAP_ROWS*TILE;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0,0,w,h);

    // draw terrain
    for(let y=0;y<MAP_ROWS;y++){
      for(let x=0;x<MAP_COLS;x++){
        drawTile(terrainLayer[idx(x,y)], x, y);
      }
    }
    // draw objects
    for(let y=0;y<MAP_ROWS;y++){
      for(let x=0;x<MAP_COLS;x++){
        drawTile(objectLayer[idx(x,y)], x, y);
      }
    }

    // gridlines (ALTTP-ish subtle)
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    for(let x=0;x<=MAP_COLS;x++){
      ctx.globalAlpha = (x%2===0) ? 0.30 : 0.18;
      ctx.beginPath();
      ctx.moveTo(x*TILE+0.5, 0);
      ctx.lineTo(x*TILE+0.5, h);
      ctx.stroke();
    }
    for(let y=0;y<=MAP_ROWS;y++){
      ctx.globalAlpha = (y%2===0) ? 0.30 : 0.18;
      ctx.beginPath();
      ctx.moveTo(0, y*TILE+0.5);
      ctx.lineTo(w, y*TILE+0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // cursor
    if(lastCell){
      const {x,y} = lastCell;
      ctx.save();
      // dark outline
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x*TILE+1, y*TILE+1, TILE-2, TILE-2);
      // gold highlight
      ctx.strokeStyle = "rgba(201,164,65,0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x*TILE+2, y*TILE+2, TILE-4, TILE-4);
      ctx.restore();
    }

    ctx.restore();
  }

  // ====== Painting ======
  let isDown = false;

  function canvasToCell(evt){
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left) * (MAP_COLS*TILE / rect.width);
    const y = (evt.clientY - rect.top) * (MAP_ROWS*TILE / rect.height);
    const cx = Math.floor(x / TILE);
    const cy = Math.floor(y / TILE);
    if(cx<0 || cy<0 || cx>=MAP_COLS || cy>=MAP_ROWS) return null;
    return { x: cx, y: cy };
  }

  function paintCell(cell){
    if(!cell) return;
    const i = idx(cell.x, cell.y);

    if(mode === "terrain"){
      terrainLayer[i] = selectedTerrain;
    }else if(mode === "objects"){
      objectLayer[i] = selectedObject;
    }else{ // eraser removes active layer based on last mode buttons
      // If user tapped Eraser button, we erase based on what was previously active:
      // - If terrain tile is selected in palette title "Tiles", erase terrain to biome default
      // - If objects title "Objects", erase object to empty
      // We'll treat eraser as "erase terrain" when palette is Tiles, else objects.
      // BUT: users expect eraser to erase current mode. We'll set eraser to erase terrain if terrain button was last active.
      // We'll store lastNonEraserMode.
    }

    lastCell = cell;
    redraw();
  }

  let lastNonEraserMode = "terrain";

  function setMode(newMode){
    if(newMode !== "eraser"){
      lastNonEraserMode = newMode;
      mode = newMode;
    }else{
      mode = "eraser";
    }
    setActiveButtons();
    buildPalette(); // palette reflects mode
  }

  function eraseCell(cell){
    if(!cell) return;
    const i = idx(cell.x, cell.y);
    if(lastNonEraserMode === "terrain"){
      terrainLayer[i] = BIOMES[biome].defaultTile;
    }else{
      objectLayer[i] = -1;
    }
    lastCell = cell;
    redraw();
  }

  function handlePointer(evt){
    const cell = canvasToCell(evt);
    if(mode === "eraser") eraseCell(cell);
    else paintCell(cell);
  }

  // ====== Wire up ======
  function bindUI(){
    // mode buttons
    document.querySelectorAll(".btn.mode").forEach(b => {
      b.addEventListener("click", () => setMode(b.dataset.mode));
    });

    // biome buttons
    document.querySelectorAll(".btn.biome").forEach(b => {
      b.addEventListener("click", () => {
        biome = b.dataset.biome;
        // update defaults
        selectedTerrain = BIOMES[biome].defaultTile;
        // if eraser is active, keep it, but erase layer uses lastNonEraserMode
        setActiveButtons();
        buildPalette();
        // if terrain layer is empty-ish, you can decide to refill; we won't auto-nuke user work
        redraw();
      });
    });

    // save/load/export/import/clear
    document.getElementById("btnSave").addEventListener("click", () => {
      saveToLocal();
      alert("Saved ✅");
    });

    document.getElementById("btnLoad").addEventListener("click", () => {
      const ok = loadFromLocal();
      if(ok){
        selectedTerrain = BIOMES[biome].defaultTile;
        setActiveButtons();
        buildPalette();
        redraw();
        alert("Loaded ✅");
      }else{
        alert("No save found (or wrong size).");
      }
    });

    document.getElementById("btnExport").addEventListener("click", exportJSON);
    document.getElementById("btnImport").addEventListener("click", importJSON);

    document.getElementById("btnClear").addEventListener("click", () => {
      if(confirm("Clear the map?")){
        clearMap();
      }
    });

    // canvas pointer paint
    canvas.addEventListener("pointerdown", (e) => {
      isDown = true;
      canvas.setPointerCapture(e.pointerId);
      handlePointer(e);
    });
    canvas.addEventListener("pointermove", (e) => {
      if(!isDown) return;
      handlePointer(e);
    });
    const end = () => { isDown = false; };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("pointerleave", end);

    // prevent double-tap zoom while painting
    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); }, { passive:false });
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); }, { passive:false });
  }

  function init(){
    // guard: canvas context
    if(!ctx){
      setStatus("Error: Canvas not supported on this browser.");
      return;
    }
    tilesetImg.addEventListener("load", () => {
      setMode("terrain");
      setActiveButtons();
      buildPalette();
      bindUI();
      resizeCanvas();
      setStatus(currentSelectionLabel());
    }, { once:true });

    // in case already cached
    if(tilesetImg.complete){
      tilesetImg.dispatchEvent(new Event("load"));
    }

    window.addEventListener("resize", resizeCanvas);
  }

  init();
})();

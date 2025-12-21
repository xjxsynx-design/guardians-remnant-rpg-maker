
(() => {
  const TILESET_PATH = {
    ancient: "assets/tileset_ancient.png",
    modern: "assets/tileset_modern.png",
  };

  const state = {
    world: "ancient",
    mode: "terrain", // terrain | objects | eraser
    view: "named",   // named | all
    pal: "m",        // s|m|l
    selectedId: -1,
    selectedName: "None",
    catalog: null,
    tilesetImg: new Image(),
    tilesetReady: false,
    mapCols: 28,
    mapRows: 18,
    mapTile: 32, // render size on map
    terrain: [],
    objects: [],
    pointerDown: false,
  };

  const el = (id) => document.getElementById(id);

  const map = el("map");
  const grid = el("grid");
  const mapCtx = map.getContext("2d");
  const gridCtx = grid.getContext("2d");

  mapCtx.imageSmoothingEnabled = false;
  gridCtx.imageSmoothingEnabled = false;

  function setActive(btnIds, activeId) {
    for (const id of btnIds) {
      const b = el(id);
      b.classList.toggle("primary", id === activeId);
      if (b.classList.contains("danger")) continue;
    }
  }

  function setWorld(world) {
    state.world = world;
    el("statusWorld").textContent = world === "ancient" ? "Ancient" : "Modern";
    el("worldAncient").classList.toggle("primary", world === "ancient");
    el("worldModern").classList.toggle("primary", world === "modern");
    loadTileset();
    renderPalette();
    draw();
  }

  function setMode(mode) {
    state.mode = mode;
    el("statusMode").textContent = mode[0].toUpperCase() + mode.slice(1);
    el("modeTerrain").classList.toggle("primary", mode === "terrain");
    el("modeObjects").classList.toggle("primary", mode === "objects");
    el("modeEraser").classList.toggle("primary", mode === "eraser");
  }

  function setView(view) {
    state.view = view;
    el("viewNamed").classList.toggle("primary", view === "named");
    el("viewAll").classList.toggle("primary", view === "all");
    renderPalette();
  }

  function setPaletteSize(pal) {
    state.pal = pal;
    el("palS").classList.toggle("primary", pal === "s");
    el("palM").classList.toggle("primary", pal === "m");
    el("palL").classList.toggle("primary", pal === "l");
    renderPalette();
  }

  function tileThumbSize() {
    return state.pal === "s" ? 36 : state.pal === "m" ? 48 : 64;
  }

  function initMap() {
    const n = state.mapCols * state.mapRows;
    state.terrain = new Array(n).fill(-1);
    state.objects = new Array(n).fill(-1);

    // default select first shared terrain
    const first = state.catalog?.sharedTerrain?.[0];
    if (first) selectTile(first.id, first.name);
  }

  function loadCatalog() {
    return fetch("catalog.json")
      .then(r => r.json())
      .then(cat => {
        state.catalog = cat;
        el("statusMeta").textContent = `${cat.meta.cols} cols • ${cat.meta.rows} rows • tileset ${cat.meta.tileSize}px • map tile ${state.mapTile}px`;
        el("palHint").textContent = "Named view shows only catalog entries for the selected world. All Tiles shows raw IDs.";
        initMap();
        loadTileset();
        renderPalette();
        draw();
      })
      .catch(err => {
        console.error(err);
        el("palHint").textContent = "Failed to load catalog.json";
      });
  }

  function loadTileset() {
    state.tilesetReady = false;
    state.tilesetImg = new Image();
    state.tilesetImg.onload = () => {
      state.tilesetReady = true;
      draw();
      renderPalette(); // refresh thumbs
    };
    state.tilesetImg.src = `${TILESET_PATH[state.world]}?v=${Date.now()}`;
  }

  function selectTile(id, name) {
    state.selectedId = id;
    state.selectedName = name || `Tile ${String(id).padStart(3,"0")}`;
    el("statusSel").textContent = `${state.selectedName} (#${state.selectedId})`;
    // update active buttons
    document.querySelectorAll(".tileBtn").forEach(b => {
      b.classList.toggle("active", Number(b.dataset.id) === state.selectedId);
    });
  }

  function entriesForWorldNamed() {
    const c = state.catalog;
    const world = state.world;
    const groups = [];

    groups.push({ title: "Shared Terrain", items: c.sharedTerrain.map(x => ({...x, world:"both"})) });

    if (world === "ancient") {
      groups.push({ title: "Ancient Structures", items: c.ancient.structures.map(x => ({...x, world:"ancient"})) });
      groups.push({ title: "Ancient Objects", items: c.ancient.objects.map(x => ({...x, world:"ancient"})) });
      groups.push({ title: "Ancient Animals", items: c.ancient.animals.map(x => ({...x, world:"ancient"})) });
      groups.push({ title: "Transportation (Ancient)", items: c.ancient.transport.map(x => ({...x, world:"ancient"})) });
    } else {
      groups.push({ title: "Modern Structures", items: c.modern.structures.map(x => ({...x, world:"modern"})) });
      groups.push({ title: "Modern Objects", items: c.modern.objects.map(x => ({...x, world:"modern"})) });
      groups.push({ title: "Vehicles (Modern)", items: c.modern.vehicles.map(x => ({...x, world:"modern"})) });
    }
    return groups;
  }

  function entriesAllTiles() {
    const c = state.catalog;
    const zones = c.zones.filter(z => z.name !== "reserved");
    const groups = [];
    for (const z of zones) {
      const start = z.startRow * c.meta.cols;
      const end = z.endRow * c.meta.cols;
      const items = [];
      for (let id=start; id<end; id++) {
        items.push({ id, name: `Tile ${String(id).padStart(3,"0")}` });
      }
      groups.push({ title: z.name, items });
    }
    return groups;
  }

  function renderPalette() {
    if (!state.catalog) return;
    const pal = el("paletteList");
    pal.innerHTML = "";
    const groups = state.view === "named" ? entriesForWorldNamed() : entriesAllTiles();

    const thumb = tileThumbSize();
    // update thumb CSS size
    const style = document.createElement("style");
    style.textContent = `.thumb{width:${thumb}px;height:${thumb}px}`;
    pal.appendChild(style);

    for (const g of groups) {
      const wrap = document.createElement("div");
      wrap.className = "group";
      const t = document.createElement("div");
      t.className = "groupTitle";
      t.textContent = g.title;
      wrap.appendChild(t);

      const tiles = document.createElement("div");
      tiles.className = "tiles";

      for (const item of g.items) {
        const btn = document.createElement("div");
        btn.className = "tileBtn" + (item.id === state.selectedId ? " active" : "");
        btn.dataset.id = item.id;

        const img = document.createElement("img");
        img.className = "thumb";
        img.alt = item.name;
        img.src = thumbDataURL(item.id, thumb, thumb);

        const lab = document.createElement("div");
        lab.className = "tileLabel";
        lab.textContent = item.name;

        btn.appendChild(img);
        btn.appendChild(lab);
        btn.addEventListener("click", () => selectTile(item.id, item.name));
        tiles.appendChild(btn);
      }

      wrap.appendChild(tiles);
      pal.appendChild(wrap);
    }
  }

  function idToSrcRect(id) {
    const c = state.catalog.meta.cols;
    const ts = state.catalog.meta.tileSize;
    const sx = (id % c) * ts;
    const sy = Math.floor(id / c) * ts;
    return {sx, sy, sw: ts, sh: ts};
  }

  function thumbDataURL(id, w, h) {
    // Use an offscreen canvas to draw the correct tile.
    const cvs = document.createElement("canvas");
    cvs.width = w; cvs.height = h;
    const ctx = cvs.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0,0,w,h);

    if (!state.tilesetReady) {
      // placeholder
      ctx.fillStyle = "#0a0d12";
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = "rgba(215,179,90,.55)";
      ctx.fillRect(0,0,w,3);
      return cvs.toDataURL();
    }

    const r = idToSrcRect(id);
    ctx.drawImage(state.tilesetImg, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
    return cvs.toDataURL();
  }

  function resizeCanvases() {
    const w = state.mapCols * state.mapTile;
    const h = state.mapRows * state.mapTile;
    map.width = w; map.height = h;
    grid.width = w; grid.height = h;

    // CSS scale to nearest integer multiple for crispness on iOS
    const maxW = Math.min(window.innerWidth - 40, w);
    const scale = Math.max(1, Math.floor(maxW / w));
    map.style.width = (w * scale) + "px";
    map.style.height = (h * scale) + "px";
    grid.style.width = (w * scale) + "px";
    grid.style.height = (h * scale) + "px";

    drawGrid();
    draw();
  }

  function drawGrid() {
    const w = grid.width, h = grid.height;
    gridCtx.clearRect(0,0,w,h);
    gridCtx.strokeStyle = "rgba(215,179,90,.25)";
    gridCtx.lineWidth = 1;

    for (let x=0; x<=w; x+=state.mapTile) {
      gridCtx.beginPath();
      gridCtx.moveTo(x+0.5,0);
      gridCtx.lineTo(x+0.5,h);
      gridCtx.stroke();
    }
    for (let y=0; y<=h; y+=state.mapTile) {
      gridCtx.beginPath();
      gridCtx.moveTo(0,y+0.5);
      gridCtx.lineTo(w,y+0.5);
      gridCtx.stroke();
    }
  }

  function drawLayer(arr) {
    if (!state.tilesetReady) return;
    for (let r=0; r<state.mapRows; r++) {
      for (let c=0; c<state.mapCols; c++) {
        const idx = r*state.mapCols + c;
        const id = arr[idx];
        if (id < 0) continue;
        const src = idToSrcRect(id);
        const dx = c*state.mapTile;
        const dy = r*state.mapTile;
        mapCtx.drawImage(state.tilesetImg, src.sx, src.sy, src.sw, src.sh, dx, dy, state.mapTile, state.mapTile);
      }
    }
  }

  function draw() {
    mapCtx.clearRect(0,0,map.width,map.height);
    // background
    mapCtx.fillStyle = "#070a0f";
    mapCtx.fillRect(0,0,map.width,map.height);

    drawLayer(state.terrain);
    drawLayer(state.objects);
  }

  function posToIndex(clientX, clientY) {
    const rect = map.getBoundingClientRect();
    const x = (clientX - rect.left) * (map.width / rect.width);
    const y = (clientY - rect.top) * (map.height / rect.height);
    const c = Math.floor(x / state.mapTile);
    const r = Math.floor(y / state.mapTile);
    if (c < 0 || r < 0 || c >= state.mapCols || r >= state.mapRows) return -1;
    return r*state.mapCols + c;
  }

  function paintAt(idx) {
    if (idx < 0) return;
    if (state.mode === "eraser") {
      // erase current layer based on last non-eraser mode? keep simple: erase both if eraser
      state.terrain[idx] = -1;
      state.objects[idx] = -1;
      return;
    }
    if (state.selectedId < 0) return;
    if (state.mode === "terrain") state.terrain[idx] = state.selectedId;
    if (state.mode === "objects") state.objects[idx] = state.selectedId;
  }

  function onPointerDown(e) {
    state.pointerDown = true;
    const idx = posToIndex(e.clientX, e.clientY);
    paintAt(idx);
    draw();
  }
  function onPointerMove(e) {
    if (!state.pointerDown) return;
    const idx = posToIndex(e.clientX, e.clientY);
    paintAt(idx);
    draw();
  }
  function onPointerUp() { state.pointerDown = false; }

  function saveJSON() {
    const data = {
      v: 1,
      meta: { cols: state.mapCols, rows: state.mapRows },
      world: state.world,
      terrain: state.terrain,
      objects: state.objects
    };
    const blob = new Blob([JSON.stringify(data)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "guardians_remnant_map.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function loadJSONFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data?.meta) throw new Error("Invalid map");
        if (data.meta.cols !== state.mapCols || data.meta.rows !== state.mapRows) {
          alert("Map size mismatch for this foundation build.");
          return;
        }
        state.terrain = data.terrain || state.terrain;
        state.objects = data.objects || state.objects;
        draw();
      } catch (e) {
        alert("Could not load map JSON.");
        console.error(e);
      }
    };
    reader.readAsText(file);
  }

  function clearMap() {
    if (!confirm("Clear the map?")) return;
    initMap();
    draw();
  }

  // wire UI
  el("worldAncient").addEventListener("click", () => setWorld("ancient"));
  el("worldModern").addEventListener("click", () => setWorld("modern"));

  el("modeTerrain").addEventListener("click", () => setMode("terrain"));
  el("modeObjects").addEventListener("click", () => setMode("objects"));
  el("modeEraser").addEventListener("click", () => setMode("eraser"));

  el("viewNamed").addEventListener("click", () => setView("named"));
  el("viewAll").addEventListener("click", () => setView("all"));

  for (const b of [el("palS"), el("palM"), el("palL")]) {
    b.addEventListener("click", () => setPaletteSize(b.dataset.pal));
  }

  el("btnSave").addEventListener("click", saveJSON);
  el("btnLoad").addEventListener("click", () => el("fileLoad").click());
  el("fileLoad").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) loadJSONFile(f);
    e.target.value = "";
  });
  el("btnClear").addEventListener("click", clearMap);

  // canvas input
  map.addEventListener("pointerdown", onPointerDown);
  map.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("resize", resizeCanvases);

  // boot
  setMode("terrain");
  setPaletteSize("m");
  setView("named");
  loadCatalog().then(() => {
    resizeCanvases();
  });
})();

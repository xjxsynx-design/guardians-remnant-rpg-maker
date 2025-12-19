
/* Guardians' Remnant — World Editor (Phase 4B FINAL)
   - Mobile-first, pointer-drag paint
   - Terrain + Objects layers
   - Eraser indicator stays synced
*/

const GRID_COLS = 16;
const GRID_ROWS = 16;

const BIOMES = {
  Overworld: ["Grass", "Dirt", "Stone"],
  Ruins: ["Stone", "Moss", "Dirt"],
  Frozen: ["Snow", "Ice", "Stone"],
};

const TILES = {
  Grass: "#4caf50",
  Dirt:  "#8b5a2b",
  Stone: "#777777",
  Moss:  "#5f7f3f",
  Snow:  "#eef2ff",
  Ice:   "#aee3ff",
};

// Simple object set (Phase 4B: basic placeholders)
const OBJECTS_BY_BIOME = {
  Overworld: [
    { id: "Tree", glyph: "🌲" },
    { id: "Rock", glyph: "🪨" },
    { id: "Chest", glyph: "🎁" },
  ],
  Ruins: [
    { id: "Pillar", glyph: "🏛️" },
    { id: "Skull", glyph: "💀" },
    { id: "Torch", glyph: "🔥" },
  ],
  Frozen: [
    { id: "Pine", glyph: "🌲" },
    { id: "IceRock", glyph: "🧊" },
    { id: "Camp", glyph: "⛺" },
  ],
};

const els = {
  status:   document.getElementById("status"),
  terrain:  document.getElementById("terrainBtn"),
  objects:  document.getElementById("objectBtn"),
  eraser:   document.getElementById("eraserBtn"),
  save:     document.getElementById("saveBtn"),
  load:     document.getElementById("loadBtn"),
  clear:    document.getElementById("clearBtn"),
  biomes:   document.getElementById("biomes"),
  palette:  document.getElementById("palette"),
  map:      document.getElementById("map"),
};

let state = {
  mode: "terrain",        // 'terrain' | 'objects'
  tool: "paint",          // 'paint' | 'erase'
  biome: "Overworld",
  tile: "Grass",
  objectId: "Tree",
};

const data = {
  terrain: Array(GRID_ROWS * GRID_COLS).fill(""),
  objects: Array(GRID_ROWS * GRID_COLS).fill(""),
};

function idxFromRC(r, c) { return r * GRID_COLS + c; }

function setActiveButton() {
  // mode buttons
  els.terrain.classList.toggle("active", state.mode === "terrain" && state.tool !== "erase");
  els.objects.classList.toggle("active", state.mode === "objects" && state.tool !== "erase");
  // eraser button reflects tool state ONLY (prevents desync)
  els.eraser.classList.toggle("active", state.tool === "erase");
}

function updateStatus() {
  const modeLabel = state.mode === "terrain" ? "Terrain" : "Objects";
  const selLabel = state.mode === "terrain" ? state.tile : state.objectId;
  els.status.textContent = `${modeLabel} • ${state.biome} • ${selLabel}`;
}

function buildBiomeButtons() {
  els.biomes.innerHTML = "";
  Object.keys(BIOMES).forEach((b) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "biome-btn";
    btn.textContent = b;
    btn.addEventListener("click", () => {
      state.biome = b;

      // Set sane defaults on biome switch
      const tiles = BIOMES[state.biome];
      state.tile = tiles[0];

      const objs = OBJECTS_BY_BIOME[state.biome] || [];
      state.objectId = objs[0]?.id || "";

      renderBiomes();
      renderPalette();
      updateStatus();
    });
    els.biomes.appendChild(btn);
  });
  renderBiomes();
}

function renderBiomes() {
  [...els.biomes.querySelectorAll(".biome-btn")].forEach((btn) => {
    btn.classList.toggle("active", btn.textContent === state.biome);
  });
}

function renderPalette() {
  els.palette.innerHTML = "";

  if (state.mode === "terrain") {
    const list = BIOMES[state.biome];
    list.forEach((name) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "pal-tile";
      tile.style.background = TILES[name] || "#444";
      tile.classList.toggle("active", state.tile === name && state.tool !== "erase");
      tile.addEventListener("click", () => {
        state.tile = name;
        state.tool = "paint"; // selecting a tile exits eraser
        setActiveButton();
        renderPalette();
        updateStatus();
      });

      const label = document.createElement("div");
      label.className = "pal-label";
      label.textContent = name;
      tile.appendChild(label);

      els.palette.appendChild(tile);
    });
  } else {
    const list = OBJECTS_BY_BIOME[state.biome] || [];
    list.forEach((obj) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "pal-tile";
      tile.style.background = "linear-gradient(#3a3b40, #24252a)";
      tile.classList.toggle("active", state.objectId === obj.id && state.tool !== "erase");
      tile.addEventListener("click", () => {
        state.objectId = obj.id;
        state.tool = "paint";
        setActiveButton();
        renderPalette();
        updateStatus();
      });

      const label = document.createElement("div");
      label.className = "pal-label";
      label.textContent = `${obj.glyph} ${obj.id}`;
      tile.appendChild(label);

      els.palette.appendChild(tile);
    });
  }
}

function buildGrid() {
  els.map.style.setProperty("--cols", String(GRID_COLS));
  els.map.style.setProperty("--rows", String(GRID_ROWS));
  els.map.innerHTML = "";

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const i = idxFromRC(r, c);
      const cell = document.createElement("div");
      cell.className = "cell";
      if ((r + c) % 2 === 1) cell.classList.add("alt");
      cell.dataset.i = String(i);

      const obj = document.createElement("div");
      obj.className = "obj";
      cell.appendChild(obj);

      els.map.appendChild(cell);
    }
  }

  renderGrid();
  attachPaintHandlers();
}

function renderGrid() {
  const cells = els.map.children;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const t = data.terrain[i];
    const o = data.objects[i];

    cell.style.background = t ? (TILES[t] || "#444") : "#2d2e31";
    const objEl = cell.querySelector(".obj");
    objEl.textContent = "";

    if (o) {
      const list = OBJECTS_BY_BIOME[state.biome] || [];
      const found = list.find(x => x.id === o);
      objEl.textContent = found?.glyph || "★";
    }
  }
}

function applyAtIndex(i) {
  if (i == null || i < 0 || i >= data.terrain.length) return;

  if (state.tool === "erase") {
    if (state.mode === "terrain") data.terrain[i] = "";
    else data.objects[i] = "";
  } else {
    if (state.mode === "terrain") data.terrain[i] = state.tile;
    else data.objects[i] = state.objectId;
  }
  renderCell(i);
}

function renderCell(i) {
  const cell = els.map.children[i];
  if (!cell) return;

  const t = data.terrain[i];
  const o = data.objects[i];

  cell.style.background = t ? (TILES[t] || "#444") : "#2d2e31";
  const objEl = cell.querySelector(".obj");
  objEl.textContent = "";

  if (o) {
    const list = OBJECTS_BY_BIOME[state.biome] || [];
    const found = list.find(x => x.id === o);
    objEl.textContent = found?.glyph || "★";
  }
}

function getCellIndexFromEvent(ev) {
  const target = ev.target.closest(".cell");
  if (!target) return null;
  return Number(target.dataset.i);
}

function attachPaintHandlers() {
  let painting = false;

  const start = (ev) => {
    painting = true;
    ev.preventDefault();
    applyAtIndex(getCellIndexFromEvent(ev));
  };

  const move = (ev) => {
    if (!painting) return;
    ev.preventDefault();
    applyAtIndex(getCellIndexFromEvent(ev));
  };

  const end = () => { painting = false; };

  els.map.addEventListener("pointerdown", start);
  els.map.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
}

function bindUI() {
  els.terrain.addEventListener("click", () => {
    state.mode = "terrain";
    state.tool = "paint";
    setActiveButton();
    renderPalette();
    updateStatus();
  });

  els.objects.addEventListener("click", () => {
    state.mode = "objects";
    state.tool = "paint";
    setActiveButton();
    renderPalette();
    updateStatus();
  });

  els.eraser.addEventListener("click", () => {
    state.tool = (state.tool === "erase") ? "paint" : "erase";
    setActiveButton();
    renderPalette();
    updateStatus();
  });

  els.save.addEventListener("click", () => {
    const payload = {
      v: 1,
      cols: GRID_COLS,
      rows: GRID_ROWS,
      biome: state.biome,
      terrain: data.terrain,
      objects: data.objects,
      savedAt: Date.now(),
    };
    localStorage.setItem("gr_world_map", JSON.stringify(payload));
    toast("Saved!");
  });

  els.load.addEventListener("click", () => {
    const raw = localStorage.getItem("gr_world_map");
    if (!raw) return toast("No save found.");
    try {
      const payload = JSON.parse(raw);
      if (!payload || !Array.isArray(payload.terrain) || !Array.isArray(payload.objects)) {
        return toast("Save data invalid.");
      }
      // Load arrays (truncate/extend if needed)
      for (let i = 0; i < data.terrain.length; i++) {
        data.terrain[i] = payload.terrain[i] || "";
        data.objects[i] = payload.objects[i] || "";
      }
      renderGrid();
      toast("Loaded!");
    } catch {
      toast("Save data unreadable.");
    }
  });

  els.clear.addEventListener("click", () => {
    if (!confirm("Clear the map? This does NOT delete your saved map.")) return;
    data.terrain.fill("");
    data.objects.fill("");
    renderGrid();
    toast("Cleared.");
  });
}

let toastTimer = null;
function toast(msg){
  els.status.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(updateStatus, 1100);
}

function init() {
  bindUI();
  buildBiomeButtons();
  setActiveButton();
  renderPalette();
  buildGrid();
  updateStatus();
}

init();
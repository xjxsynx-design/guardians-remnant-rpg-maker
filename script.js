
/* Guardians' Remnant — World Editor (Phase 4C)
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

// Object set (Phase 4C: themed icons, no emoji placeholders)
const OBJECTS_BY_BIOME = {
  Overworld: [
    { id: "Tree", label: "Tree" },
    { id: "Rock", label: "Boulder" },
    { id: "Chest", label: "Chest" },
  ],
  Ruins: [
    { id: "Pillar", label: "Pillar" },
    { id: "Skull", label: "Skull" },
    { id: "Torch", label: "Torch" },
  ],
  Frozen: [
    { id: "Pine", label: "Pine" },
    { id: "IceRock", label: "Ice Rock" },
    { id: "Camp", label: "Camp" },
  ],
};

const OBJECT_ICON = {
  "Tree": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l-6 8h4l-4 6h5v4h2v-4h5l-4-6h4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  "Rock": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l3-7 8-1 4 7-3 8H8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  "Chest": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h14v9H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 10l2-4h10l2 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 12v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10.5 15h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  "Pillar": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8M9 6h6v14H9zM7 20h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  "Skull": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4c-4 0-7 3-7 7 0 3 2 5 4 6v3h6v-3c2-1 4-3 4-6 0-4-3-7-7-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 11h.01M15 11h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M10 15h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  "Torch": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c2 2 3 4 3 6 0 2-1 3-3 4-2-1-3-2-3-4 0-2 1-4 3-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 12v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  "Pine": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l-5 6h3l-3 4h4l-3 4h8l-3-4h4l-3-4h3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  "IceRock": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 15l2-8 6-2 5 6-2 9H9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 9l2 2 3-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  "Camp": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20L12 6l8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7 20h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 13l2 4h-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
};

const OBJECT_COLOR = {
  "Tree": "#6bd36b",
  "Rock": "#c2c6cf",
  "Chest": "#e2c15b",
  "Pillar": "#d7d9df",
  "Skull": "#e6e6e6",
  "Torch": "#f2a13a",
  "Pine": "#6bd36b",
  "IceRock": "#8bd0ff",
  "Camp": "#d7d9df",
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

      const icon = document.createElement("div");
      icon.className = "pal-icon";
      icon.innerHTML = OBJECT_ICON[obj.id] || "";
      icon.style.color = OBJECT_COLOR[obj.id] || "rgba(230,230,230,.9)";
      tile.appendChild(icon);

      const label = document.createElement("div");
      label.className = "pal-label";
      label.textContent = obj.label || obj.id;
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
  objEl.innerHTML = "";

  if (o) {
    objEl.innerHTML = OBJECT_ICON[o] || "";
    objEl.style.color = OBJECT_COLOR[o] || "rgba(230,230,230,.9)";
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

  els.save.addEventListener("click", async () => {
    const payload = {
      version: "4C",
      name: "Untitled",
      rows: GRID_ROWS,
      cols: GRID_COLS,
      biome: state.biome,
      terrain: [...data.terrain],
      objects: [...data.objects],
      savedAt: Date.now(),
    };

    const json = JSON.stringify(payload);

    // Always keep a local quick-save
    localStorage.setItem("gr_world_map_v2", json);

    // Try to copy JSON to clipboard for easy sharing/backups (works on GitHub Pages HTTPS)
    try {
      await navigator.clipboard.writeText(json);
      toast("Saved + copied JSON!");
    } catch {
      // Fallback: show in a prompt so you can copy manually
      prompt("Map JSON (copy this somewhere safe):", json);
      toast("Saved locally.");
    }
  });

  els.load.addEventListener("click", () => {
    // Primary: allow paste/import (Phase 4C)
    const pasted = prompt("Paste map JSON to import (Cancel to load last saved map):", "");
    let raw = pasted && pasted.trim() ? pasted.trim() : null;

    // Fallback: last quick-save
    if (!raw) raw = localStorage.getItem("gr_world_map_v2") || localStorage.getItem("gr_world_map");

    if (!raw) return toast("No save found.");

    try {
      const payload = JSON.parse(raw);

      // Accept both v4B and v4C shapes
      const terr = payload?.terrain;
      const objs = payload?.objects;

      if (!Array.isArray(terr) || !Array.isArray(objs)) {
        return toast("Save data invalid.");
      }

      // Optional metadata
      if (typeof payload.biome === "string" && BIOMES[payload.biome]) {
        state.biome = payload.biome;
      }

      // Normalize sizes (supports older saves or future size changes)
      const max = GRID_ROWS * GRID_COLS;
      data.terrain.fill("");
      data.objects.fill("");
      for (let i = 0; i < max; i++) {
        data.terrain[i] = terr[i] || "";
        data.objects[i] = objs[i] || "";
      }

      // Ensure selected defaults exist in the loaded biome
      const firstTile = BIOMES[state.biome]?.[0] || "Grass";
      state.tile = BIOMES[state.biome]?.includes(state.tile) ? state.tile : firstTile;

      renderBiomes();
      renderPalette();
      setActiveButton();
      updateStatus();
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
// Guardians' Remnant – World Builder (Phase 4B cleanup)
// Notes:
// - Modes are now mutually exclusive: 'terrain' | 'object' | 'eraser'
// - Visual indicator (active button + palette) always matches the current mode
// - Map tiles are square via CSS aspect-ratio (no JS sizing needed)

const terrainBtn = document.getElementById("terrainBtn");
const objectBtn  = document.getElementById("objectBtn");
const eraserBtn  = document.getElementById("eraserBtn");

const biomeBar   = document.getElementById("biomes");
const paletteBar = document.getElementById("palette");
const map        = document.getElementById("map");
const status     = document.getElementById("status");

const saveBtn    = document.getElementById("saveBtn");
const loadBtn    = document.getElementById("loadBtn");

const BIOMES = {
  Overworld: ["Grass", "Dirt", "Stone"],
  Ruins:     ["Stone", "Moss", "Dirt"],
  Frozen:    ["Snow", "Ice", "Stone"]
};

const TILES = {
  Grass: "#4caf50",
  Dirt:  "#8b5a2b",
  Stone: "#777",
  Moss:  "#5f7f3f",
  Snow:  "#eef",
  Ice:   "#aee"
};

const OBJECTS = {
  Tree:   "#2e7d32",
  Pillar: "#999",
  Ruin:   "#795548"
};

let mode = "terrain";          // 'terrain' | 'object' | 'eraser'
let currentBiome  = "Overworld";
let currentTile   = BIOMES[currentBiome][0];
let currentObject = "Tree";

function setMode(nextMode){
  mode = nextMode;

  terrainBtn.classList.toggle("mode-active", mode === "terrain");
  objectBtn.classList.toggle("mode-active",  mode === "object");
  eraserBtn.classList.toggle("mode-active",  mode === "eraser");

  // Palette should reflect mode immediately
  buildPalette();
  updateStatus();
}

terrainBtn.addEventListener("click", () => setMode("terrain"));
objectBtn.addEventListener("click",  () => setMode("object"));
eraserBtn.addEventListener("click",  () => setMode(mode === "eraser" ? "terrain" : "eraser"));

// --- Status Bar ---
function updateStatus() {
  if (mode === "eraser") {
    status.textContent = "Mode: Eraser";
  } else if (mode === "terrain") {
    status.textContent = `Mode: Terrain | Biome: ${currentBiome} | Tile: ${currentTile}`;
  } else {
    status.textContent = `Mode: Objects | Object: ${currentObject}`;
  }
}

// --- Biomes ---
function buildBiomes() {
  biomeBar.innerHTML = "";
  Object.keys(BIOMES).forEach((b) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = b;
    btn.classList.toggle("active", b === currentBiome);

    btn.addEventListener("click", () => {
      currentBiome = b;
      // if you change biome, keep terrain mode selection consistent
      currentTile = BIOMES[currentBiome][0];

      buildBiomes();
      buildPalette();
      updateStatus();
    });

    biomeBar.appendChild(btn);
  });
}

// --- Palette ---
function buildPalette() {
  paletteBar.innerHTML = "";

  // Show biome row always (but it still works best in terrain mode)
  // If you prefer to hide biome buttons in object/eraser mode, we can do that later.

  if (mode === "eraser") {
    const d = document.createElement("div");
    d.className = "palette-tile selected eraser";
    d.title = "Eraser";
    paletteBar.appendChild(d);
    return;
  }

  if (mode === "terrain") {
    BIOMES[currentBiome].forEach((t) => {
      const d = document.createElement("div");
      d.className = "palette-tile";
      d.style.background = TILES[t];
      d.classList.toggle("selected", t === currentTile);
      d.title = t;

      d.addEventListener("click", () => {
        currentTile = t;
        buildPalette();
        updateStatus();
      });

      paletteBar.appendChild(d);
    });
    return;
  }

  // object mode
  Object.keys(OBJECTS).forEach((o) => {
    const d = document.createElement("div");
    d.className = "palette-tile";
    d.style.background = OBJECTS[o];
    d.classList.toggle("selected", o === currentObject);
    d.title = o;

    d.addEventListener("click", () => {
      currentObject = o;
      buildPalette();
      updateStatus();
    });

    paletteBar.appendChild(d);
  });
}

// --- Map ---
function buildMap() {
  map.innerHTML = "";

  for (let i = 0; i < 100; i++) {
    const d = document.createElement("div");
    d.className = "tile";

    // Tap behavior (mobile-first)
    d.addEventListener("click", () => applyToTile(d));

    map.appendChild(d);
  }
}

function applyToTile(tile){
  if (mode === "eraser") {
    tile.style.background = "";
    const obj = tile.querySelector(".object");
    if (obj) obj.remove();
    return;
  }

  if (mode === "terrain") {
    tile.style.background = TILES[currentTile];
    return;
  }

  // object mode
  let obj = tile.querySelector(".object");
  if (!obj) {
    obj = document.createElement("div");
    obj.className = "object";
    tile.appendChild(obj);
  }
  obj.style.background = OBJECTS[currentObject];
}

// --- Save/Load ---
saveBtn.addEventListener("click", () => {
  const mapData = [];
  map.querySelectorAll(".tile").forEach((tile) => {
    const obj = tile.querySelector(".object");
    mapData.push({
      background: tile.style.background || null,
      object: obj ? obj.style.background : null
    });
  });
  localStorage.setItem("savedMap", JSON.stringify(mapData));
  alert("Map saved!");
});

loadBtn.addEventListener("click", () => {
  const raw = localStorage.getItem("savedMap");
  if (!raw) return alert("No saved map found!");
  const mapData = JSON.parse(raw);

  const tiles = map.querySelectorAll(".tile");
  mapData.forEach((data, idx) => {
    const tile = tiles[idx];
    if (!tile) return;

    tile.style.background = data.background || "";

    let obj = tile.querySelector(".object");
    if (data.object) {
      if (!obj) {
        obj = document.createElement("div");
        obj.className = "object";
        tile.appendChild(obj);
      }
      obj.style.background = data.object;
    } else if (obj) {
      obj.remove();
    }
  });

  alert("Map loaded!");
});

// --- Initialize ---
buildBiomes();
buildPalette();
buildMap();
setMode("terrain");

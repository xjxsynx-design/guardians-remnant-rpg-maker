let eraserActive = false;

const eraserBtn = document.getElementById("eraserBtn");
const terrainBtn = document.getElementById("terrainBtn");
const objectBtn = document.getElementById("objectBtn");
const biomeBar = document.getElementById("biomes");
const paletteBar = document.getElementById("palette");
const map = document.getElementById("map");
const status = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");

const BIOMES = {
  Overworld: ["Grass", "Dirt", "Stone"],
  Ruins: ["Stone", "Moss", "Dirt"],
  Frozen: ["Snow", "Ice", "Stone"]
};

const TILES = {
  Grass: "#4caf50",
  Dirt: "#8b5a2b",
  Stone: "#777",
  Moss: "#5f7f3f",
  Snow: "#eef",
  Ice: "#aee"
};

const OBJECTS = {
  Tree: "#2e7d32",
  Pillar: "#999",
  Ruin: "#795548"
};

let mode = "terrain";
let currentBiome = "Overworld";
let currentTile = "Grass";
let currentObject = "Tree";

// --- Mode buttons ---
terrainBtn.onclick = () => switchMode("terrain");
objectBtn.onclick = () => switchMode("object");

eraserBtn.onclick = () => {
  eraserActive = !eraserActive;
  eraserBtn.classList.toggle("eraser-active", eraserActive);

  if (eraserActive) {
    mode = "eraser";
    terrainBtn.classList.remove("mode-active");
    objectBtn.classList.remove("mode-active");
  } else {
    mode = "terrain";
    terrainBtn.classList.add("mode-active");
  }

  buildPalette();
  updateStatus();
};

// --- Save/Load ---
saveBtn.onclick = () => {
  const mapData = [];
  map.querySelectorAll(".tile").forEach(tile => {
    const obj = tile.querySelector(".object");
    mapData.push({
      background: tile.style.background || null,
      object: obj ? obj.style.background : null
    });
  });
  localStorage.setItem("savedMap", JSON.stringify(mapData));
  alert("Map saved!");
};

loadBtn.onclick = () => {
  const mapData = JSON.parse(localStorage.getItem("savedMap"));
  if (!mapData) return alert("No saved map found!");
  const tiles = map.querySelectorAll(".tile");
  mapData.forEach((data, index) => {
    const tile = tiles[index];
    tile.style.background = data.background || "#333";
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
};

// --- Switch Mode ---
function switchMode(m) {
  mode = m;
  eraserActive = false;
  eraserBtn.classList.remove("eraser-active");

  terrainBtn.classList.toggle("mode-active", m === "terrain");
  objectBtn.classList.toggle("mode-active", m === "object");

  buildPalette();
  updateStatus();
}

// --- Status Bar ---
function updateStatus() {
  if (eraserActive) {
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
  Object.keys(BIOMES).forEach(b => {
    const btn = document.createElement("button");
    btn.textContent = b;
    if (b === currentBiome) btn.classList.add("active");
    btn.onclick = () => {
      currentBiome = b;
      currentTile = BIOMES[b][0];
      buildBiomes();
      buildPalette();
      updateStatus();
    };
    biomeBar.appendChild(btn);
  });
}

// --- Palette ---
function buildPalette() {
  paletteBar.innerHTML = "";
  const mapWidth = map.clientWidth;
  const tileSize = mapWidth / 10 - 2;

  if (eraserActive) {
    const d = document.createElement("div");
    d.className = "palette-tile selected eraser";
    d.style.width = `${tileSize}px`;
    paletteBar.appendChild(d);
    return;
  }

  if (mode === "terrain") {
    BIOMES[currentBiome].forEach(t => {
      const d = document.createElement("div");
      d.className = "palette-tile";
      d.style.background = TILES[t];
      d.style.width = `${tileSize}px`;
      if (t === currentTile) d.classList.add("selected");
      d.onclick = () => { currentTile = t; buildPalette(); updateStatus(); };
      paletteBar.appendChild(d);
    });
  } else {
    Object.keys(OBJECTS).forEach(o => {
      const d = document.createElement("div");
      d.className = "palette-tile";
      d.style.background = OBJECTS[o];
      d.style.width = `${tileSize}px`;
      if (o === currentObject) d.classList.add("selected");
      d.onclick = () => { currentObject = o; buildPalette(); updateStatus(); };
      paletteBar.appendChild(d);
    });
  }
}

// --- Map ---
function buildMap() {
  map.innerHTML = "";
  for (let i = 0; i < 100; i++) {
    const d = document.createElement("div");
    d.className = "tile";
    d.onclick = () => {
      if (eraserActive) {
        d.style.background = "#333";
        const obj = d.querySelector(".object");
        if (obj) obj.remove();
        return;
      }

      if (mode === "terrain") {
        d.style.background = TILES[currentTile];
      } else {
        let obj = d.querySelector(".object");
        if (!obj) {
          obj = document.createElement("div");
          obj.className = "object";
          d.appendChild(obj);
        }
        obj.style.background = OBJECTS[currentObject];
      }
    };
    map.appendChild(d);
  }
}

// --- Initialize ---
buildBiomes();
buildPalette();
buildMap();
updateStatus();
window.addEventListener("resize", buildPalette);

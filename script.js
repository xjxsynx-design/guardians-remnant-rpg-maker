const BIOMES = {
  Overworld: ["Grass","Dirt","Stone"],
  Ruins: ["Stone","Moss","Dirt"],
  Frozen: ["Snow","Ice","Stone"]
};

const TILES = {
  Grass:"#4caf50",
  Dirt:"#8b5a2b",
  Stone:"#777",
  Moss:"#5f7f3f",
  Snow:"#eef",
  Ice:"#aee"
};

let mode = "terrain";
let eraser = false;
let currentBiome = "Overworld";
let currentTile = "Grass";

const map = document.getElementById("map");
const palette = document.getElementById("palette");
const biomes = document.getElementById("biomes");

const terrainBtn = document.getElementById("terrainBtn");
const objectBtn = document.getElementById("objectBtn");
const eraserBtn = document.getElementById("eraserBtn");

function buildMap() {
  map.innerHTML = "";
  for (let i=0;i<400;i++) {
    const t = document.createElement("div");
    t.className = "tile";
    t.addEventListener("click", () => paintTile(t));
    map.appendChild(t);
  }
}

function paintTile(tile) {
  if (eraser) {
    tile.style.background = "#111";
    tile.classList.remove("object");
    return;
  }
  tile.style.background = TILES[currentTile];
  if (mode === "object") tile.classList.add("object");
}

function updateTools() {
  terrainBtn.classList.toggle("active", mode==="terrain" && !eraser);
  objectBtn.classList.toggle("active", mode==="object" && !eraser);
  eraserBtn.classList.toggle("active", eraser);
}

terrainBtn.onclick = () => { mode="terrain"; eraser=false; updateTools(); };
objectBtn.onclick = () => { mode="object"; eraser=false; updateTools(); };
eraserBtn.onclick = () => { eraser=true; updateTools(); };

function buildBiomes() {
  biomes.innerHTML = "";
  Object.keys(BIOMES).forEach(b => {
    const btn = document.createElement("button");
    btn.textContent = b;
    btn.className = "tool";
    btn.onclick = () => {
      currentBiome = b;
      buildPalette();
    };
    biomes.appendChild(btn);
  });
}

function buildPalette() {
  palette.innerHTML = "";
  BIOMES[currentBiome].forEach(tile => {
    const d = document.createElement("div");
    d.className = "palette-tile";
    d.style.background = TILES[tile];
    if (tile === currentTile) d.classList.add("active");
    d.onclick = () => {
      currentTile = tile;
      buildPalette();
    };
    palette.appendChild(d);
  });
}

buildMap();
buildBiomes();
buildPalette();
updateTools();

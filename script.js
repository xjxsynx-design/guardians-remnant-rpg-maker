const TILE_SIZE = 32;
const MAP_W = 20;
const MAP_H = 15;

let currentWorld = "ancient";
let currentTile = null;

const map = document.getElementById("map");
const palette = document.getElementById("palette");
const buttons = document.querySelectorAll("#world-toggle button");

const catalog = {
  ancient: [
    { id: "grass", label: "Grass" },
    { id: "stone", label: "Stone" },
    { id: "water", label: "Water" }
  ],
  modern: [
    { id: "asphalt", label: "Asphalt" },
    { id: "sidewalk", label: "Sidewalk" },
    { id: "grass", label: "Grass" }
  ]
};

function buildMap() {
  map.innerHTML = "";
  for (let i = 0; i < MAP_W * MAP_H; i++) {
    const cell = document.createElement("div");
    cell.style.width = TILE_SIZE + "px";
    cell.style.height = TILE_SIZE + "px";
    cell.style.border = "1px solid #222";
    cell.addEventListener("click", () => {
      if (currentTile) {
        cell.style.backgroundImage =
          `url(assets/tileset_${currentWorld}.png)`;
        cell.style.backgroundPosition = "0px 0px";
      }
    });
    map.appendChild(cell);
  }
}

function buildPalette() {
  palette.innerHTML = "";
  catalog[currentWorld].forEach(tile => {
    const el = document.createElement("div");
    el.className = "palette-tile";
    el.title = tile.label;
    el.addEventListener("click", () => {
      document
        .querySelectorAll(".palette-tile")
        .forEach(p => p.classList.remove("active"));
      el.classList.add("active");
      currentTile = tile;
    });
    palette.appendChild(el);
  });
}

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentWorld = btn.dataset.world;
    buildPalette();
  });
});

buildPalette();
buildMap();

const grid = document.getElementById("grid");
const paletteDiv = document.getElementById("palette");
const biomeButtons = document.querySelectorAll(".biome-btn");

let currentTile = "grass";
let currentBiome = "overworld";

const BIOMES = {
  overworld: [
    { id: "grass", label: "Grass" },
    { id: "sand", label: "Sand" }
  ],
  ruins: [
    { id: "ruins", label: "Ruins" }
  ],
  frozen: [
    { id: "snow", label: "Snow" }
  ]
};

function buildPalette() {
  paletteDiv.innerHTML = "";
  BIOMES[currentBiome].forEach((tile, index) => {
    const btn = document.createElement("button");
    btn.textContent = tile.label;
    if (index === 0) btn.classList.add("active");
    btn.addEventListener("click", () => {
      document.querySelectorAll(".palette button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTile = tile.id;
    });
    paletteDiv.appendChild(btn);
  });
  currentTile = BIOMES[currentBiome][0].id;
}

biomeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    biomeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentBiome = btn.dataset.biome;
    buildPalette();
  });
});

buildPalette();

for (let i = 0; i < 256; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.addEventListener("click", () => {
    cell.className = "cell";
    cell.classList.add(currentTile);
  });
  grid.appendChild(cell);
}

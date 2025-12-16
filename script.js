const gridSize = 10;
let selectedTile = "grass";
let currentLayer = "ground";

const mapData = {
  ground: Array(gridSize*gridSize).fill(null),
  objects: Array(gridSize*gridSize).fill(null)
};

const grid = document.getElementById("grid");
const layerSelect = document.getElementById("layerSelect");

layerSelect.onchange = () => currentLayer = layerSelect.value;

function selectTile(tile) {
  selectedTile = tile;
}

function renderGrid() {
  grid.innerHTML = "";
  for (let i = 0; i < gridSize*gridSize; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";

    const g = mapData.ground[i];
    const o = mapData.objects[i];

    if (g) cell.style.background = tileColor(g);
    if (o) cell.style.background = tileColor(o);

    cell.onclick = () => {
      mapData[currentLayer][i] = selectedTile;
      renderGrid();
    };
    grid.appendChild(cell);
  }
}

function tileColor(tile) {
  return {
    grass:"#3a7f3a",
    sand:"#c9b26b",
    stone:"#888",
    water:"#2f6f7f",
    ruin:"#5a5a5a"
  }[tile] || "#222";
}

function saveMap() {
  const data = JSON.stringify(mapData);
  const blob = new Blob([data], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "map_layers.json";
  a.click();
}

function loadMap() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const data = JSON.parse(e.target.result);
    mapData.ground = data.ground;
    mapData.objects = data.objects;
    renderGrid();
  };
  reader.readAsText(file);
}

renderGrid();

const size = 10;
let selectedTile = "grass";
let currentLayer = "ground";

const mapData = {
  ground: Array(size*size).fill(null),
  objects: Array(size*size).fill(null)
};

const grid = document.getElementById("grid");
const layerSelect = document.getElementById("layerSelect");

layerSelect.onchange = () => currentLayer = layerSelect.value;

function selectTile(tile) {
  selectedTile = tile;
}

function tileColor(tile) {
  return {
    grass:"#3a7f3a",
    sand:"#c9b26b",
    water:"#2f6f7f",
    stone:"#888",
    ruin:"#5a5a5a"
  }[tile] || "#222";
}

function render() {
  grid.innerHTML = "";
  for (let i = 0; i < size*size; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";

    const g = mapData.ground[i];
    const o = mapData.objects[i];

    if (g) cell.style.background = tileColor(g);
    if (o) cell.style.background = tileColor(o);

    cell.onclick = () => {
      mapData[currentLayer][i] = selectedTile;
      render();
    };

    grid.appendChild(cell);
  }
}

function saveMap() {
  const blob = new Blob([JSON.stringify(mapData)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "map_2_layers.json";
  a.click();
}

function loadMap() {
  const file = document.getElementById("loadFile").files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    const data = JSON.parse(e.target.result);
    mapData.ground = data.ground;
    mapData.objects = data.objects;
    render();
  };
  r.readAsText(file);
}

render();

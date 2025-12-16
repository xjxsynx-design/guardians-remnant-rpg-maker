const size = 10;
let selectedTile = "grass";
let currentLayer = "ground";

const mapData = {
  ground: Array(size*size).fill(null),
  objects: Array(size*size).fill(null)
};

const grid = document.getElementById("grid");
const toggleGround = document.getElementById("toggleGround");
const toggleObjects = document.getElementById("toggleObjects");

document.querySelectorAll('input[name="layer"]').forEach(r => {
  r.onchange = () => currentLayer = r.value;
});

toggleGround.onchange = render;
toggleObjects.onchange = render;

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

    if (toggleGround.checked && mapData.ground[i]) {
      cell.style.background = tileColor(mapData.ground[i]);
    }
    if (toggleObjects.checked && mapData.objects[i]) {
      cell.style.background = tileColor(mapData.objects[i]);
    }

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
  a.download = "map.json";
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

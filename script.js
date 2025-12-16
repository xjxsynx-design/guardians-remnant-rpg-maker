const tileSize = 32;
const mapSize = 10;
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

let currentLayer = "ground";
let currentTile = null;

const tiles = {
  ground: [
    {id:"grass", src:"tiles/ground/grass.png"},
    {id:"sand", src:"tiles/ground/sand.png"},
    {id:"stone", src:"tiles/ground/stone.png"},
    {id:"water", src:"tiles/ground/water.png"},
  ],
  objects: [
    {id:"ruin", src:"tiles/objects/ruin.png"},
    {id:"tree", src:"tiles/objects/tree.png"},
  ]
};

const mapData = {
  ground: Array(mapSize*mapSize).fill(null),
  objects: Array(mapSize*mapSize).fill(null)
};

function resize() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  draw();
}

window.addEventListener("resize", resize);

document.querySelectorAll('input[name="layer"]').forEach(r => {
  r.onchange = () => {
    currentLayer = r.value;
    buildPalette();
  };
});

function buildPalette() {
  const pal = document.getElementById("palette");
  pal.innerHTML = "";
  tiles[currentLayer].forEach(t => {
    const img = document.createElement("img");
    img.src = t.src;
    img.className = "tile";
    img.onclick = () => currentTile = t.id;
    pal.appendChild(img);
  });
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const scale = Math.floor(canvas.width / (mapSize * tileSize));
  const size = tileSize * scale;

  for (let i=0;i<mapData.ground.length;i++) {
    const x = (i % mapSize) * size;
    const y = Math.floor(i / mapSize) * size;

    ["ground","objects"].forEach(layer => {
      const id = mapData[layer][i];
      if (id) {
        const tile = tiles[layer].find(t=>t.id===id);
        if (tile) {
          const img = new Image();
          img.src = tile.src;
          img.onload = () => ctx.drawImage(img, x, y, size, size);
        }
      }
    });

    ctx.strokeStyle="#333";
    ctx.strokeRect(x,y,size,size);
  }
}

canvas.addEventListener("click", e => {
  if (!currentTile) return;
  const rect = canvas.getBoundingClientRect();
  const scale = Math.floor(canvas.width / (mapSize * tileSize));
  const size = tileSize * scale;
  const x = Math.floor((e.clientX-rect.left)/size);
  const y = Math.floor((e.clientY-rect.top)/size);
  const idx = y*mapSize+x;
  mapData[currentLayer][idx] = currentTile;
  draw();
});

function saveProject() {
  const blob = new Blob([JSON.stringify(mapData)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "world.json";
  a.click();
}

function loadProject() {
  const f = document.getElementById("loadFile").files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    const d = JSON.parse(e.target.result);
    mapData.ground = d.ground;
    mapData.objects = d.objects;
    draw();
  };
  r.readAsText(f);
}

buildPalette();
resize();

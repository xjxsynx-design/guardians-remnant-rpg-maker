const BIOMES={
  Overworld:["Grass","Dirt","Stone"],
  Ruins:["Stone","Moss","Dirt"],
  Frozen:["Snow","Ice","Stone"]
};

const TILES={
  Grass:"#4caf50",
  Dirt:"#8b5a2b",
  Stone:"#777",
  Moss:"#5f7f3f",
  Snow:"#eef",
  Ice:"#aee"
};

const OBJECTS={
  Tree:"#2e7d32",
  Pillar:"#999",
  Ruin:"#795548"
};

let mode="terrain";
let currentBiome="Overworld";
let currentTile="Grass";
let currentObject="Tree";

const biomeBar=document.getElementById("biomes");
const paletteBar=document.getElementById("palette");
const map=document.getElementById("map");
const status=document.getElementById("status");

const terrainBtn=document.getElementById("terrainBtn");
const objectBtn=document.getElementById("objectBtn");

terrainBtn.onclick=()=>switchMode("terrain");
objectBtn.onclick=()=>switchMode("object");

function switchMode(m){
  mode=m;
  terrainBtn.classList.toggle("active",m==="terrain");
  objectBtn.classList.toggle("active",m==="object");
  buildPalette();
  updateStatus();
}

function updateStatus(){
  status.textContent = mode==="terrain"
    ? `Mode: Terrain | Biome: ${currentBiome} | Tile: ${currentTile}`
    : `Mode: Objects | Object: ${currentObject}`;
}

function buildBiomes(){
  biomeBar.innerHTML="";
  Object.keys(BIOMES).forEach(b=>{
    const btn=document.createElement("button");
    btn.textContent=b;
    if(b===currentBiome)btn.classList.add("active");
    btn.onclick=()=>{
      currentBiome=b;
      currentTile=BIOMES[b][0];
      buildBiomes();
      buildPalette();
      updateStatus();
    };
    biomeBar.appendChild(btn);
  });
}

function buildPalette(){
  paletteBar.innerHTML="";
  if(mode==="terrain"){
    BIOMES[currentBiome].forEach(t=>{
      const d=document.createElement("div");
      d.className="palette-tile";
      d.style.background=TILES[t];
      if(t===currentTile)d.classList.add("selected");
      d.onclick=()=>{currentTile=t;buildPalette();updateStatus();};
      paletteBar.appendChild(d);
    });
  } else {
    Object.keys(OBJECTS).forEach(o=>{
      const d=document.createElement("div");
      d.className="palette-tile";
      d.style.background=OBJECTS[o];
      if(o===currentObject)d.classList.add("selected");
      d.onclick=()=>{currentObject=o;buildPalette();updateStatus();};
      paletteBar.appendChild(d);
    });
  }
}

function buildMap(){
  map.innerHTML="";
  for(let i=0;i<100;i++){
    const d=document.createElement("div");
    d.className="tile";
    d.onclick=()=>{
      if(mode==="terrain"){
        d.style.background=TILES[currentTile];
      } else {
        let obj=d.querySelector(".object");
        if(!obj){
          obj=document.createElement("div");
          obj.className="object";
          d.appendChild(obj);
        }
        obj.style.background=OBJECTS[currentObject];
      }
    };
    map.appendChild(d);
  }
}

buildBiomes();
buildPalette();
buildMap();
updateStatus();

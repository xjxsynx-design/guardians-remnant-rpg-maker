const biomes=["Overworld","Ruins","Frozen"];
const tiles={Grass:"#4caf50",Dirt:"#8b5a2b",Stone:"#777",Moss:"#5f7f3f",Snow:"#eef",Ice:"#aee"};
let currentBiome="Overworld";
let currentTile="Grass";
const biomeBar=document.getElementById("biomes");
const paletteBar=document.getElementById("palette");
const map=document.getElementById("map");
const status=document.getElementById("status");
function updateStatus(){status.textContent=`Biome: ${currentBiome} | Tile: ${currentTile}`}
function buildBiomes(){biomeBar.innerHTML="";biomes.forEach(b=>{const btn=document.createElement("button");btn.textContent=b;if(b===currentBiome)btn.classList.add("active");btn.onclick=()=>{currentBiome=b;buildBiomes();updateStatus()};biomeBar.appendChild(btn)})}
function buildPalette(){paletteBar.innerHTML="";Object.keys(tiles).forEach(t=>{const d=document.createElement("div");d.className="palette-tile";d.style.background=tiles[t];if(t===currentTile)d.classList.add("selected");d.onclick=()=>{currentTile=t;buildPalette();updateStatus()};paletteBar.appendChild(d)})}
function buildMap(){map.innerHTML="";for(let i=0;i<100;i++){const d=document.createElement("div");d.className="tile";d.onclick=()=>d.style.background=tiles[currentTile];map.appendChild(d)}}
buildBiomes();buildPalette();buildMap();updateStatus();
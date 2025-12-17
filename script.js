const tiles={grass:"#4caf50",dirt:"#8b5a2b",stone:"#777",moss:"#5f7f3f",cracked:"#999",snow:"#eef",ice:"#aee",rock:"#555"};
let currentTile="grass";
const biomes=document.getElementById("biomes");
const palette=document.getElementById("palette");
const map=document.getElementById("map");
["overworld","ruins","frozen"].forEach(b=>{const btn=document.createElement("button");btn.textContent=b;biomes.appendChild(btn)});
Object.keys(tiles).forEach(t=>{const b=document.createElement("button");b.style.background=tiles[t];b.onclick=()=>currentTile=t;palette.appendChild(b)});
for(let i=0;i<100;i++){const d=document.createElement("div");d.className="tile";d.onclick=()=>d.style.background=tiles[currentTile];map.appendChild(d)};
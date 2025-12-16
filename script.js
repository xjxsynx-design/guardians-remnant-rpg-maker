
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const size = 10;
const tileSize = 40;
let tool = "paint";
let selectedColor = "#3a7";

const biomes = {
  grass: ["#3a7","#5c9"],
  desert: ["#caa","#dbb"],
  snow: ["#eef","#ccd"],
  ruins: ["#777","#999"],
  water: ["#36a","#58c"]
};

let map = Array(size*size).fill(null);

function drawGrid(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const i = y*size+x;
      if(map[i]){
        ctx.fillStyle = map[i];
        ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
      }
      ctx.strokeStyle="#333";
      ctx.strokeRect(x*tileSize,y*tileSize,tileSize,tileSize);
    }
  }
}

function buildTiles(){
  const cont = document.getElementById("tiles");
  cont.innerHTML="";
  biomes[document.getElementById("biomeSelect").value].forEach(c=>{
    const d=document.createElement("div");
    d.className="tile";
    d.style.background=c;
    d.onclick=()=>selectedColor=c;
    cont.appendChild(d);
  });
}

canvas.onclick=e=>{
  const r=canvas.getBoundingClientRect();
  const x=Math.floor((e.clientX-r.left)/tileSize);
  const y=Math.floor((e.clientY-r.top)/tileSize);
  const i=y*size+x;
  map[i]= tool==="erase"? null:selectedColor;
  drawGrid();
};

document.getElementById("paintBtn").onclick=()=>tool="paint";
document.getElementById("eraseBtn").onclick=()=>tool="erase";
document.getElementById("biomeSelect").onchange=buildTiles;

document.getElementById("saveBtn").onclick=()=>{
  const data = JSON.stringify(map);
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([data],{type:"application/json"}));
  a.download="map.json";
  a.click();
};

document.getElementById("loadInput").onchange=e=>{
  const f=e.target.files[0];
  if(!f)return;
  const r=new FileReader();
  r.onload=()=>{ map=JSON.parse(r.result); drawGrid(); };
  r.readAsText(f);
};

buildTiles();
drawGrid();

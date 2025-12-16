const size=10,tile=32;
let tool='paint',layer='ground';
let map={ground:Array(size*size).fill(0),objects:Array(size*size).fill(0)};
const ctx=document.getElementById('map').getContext('2d');

document.getElementById('layerSelect').onchange=e=>layer=e.target.value;

function setTool(t){
 tool=t;
 paintBtn.classList.toggle('active',t==='paint');
 eraseBtn.classList.toggle('active',t==='erase');
}

mapCanvas=document.getElementById('map');
mapCanvas.onclick=e=>{
 const x=Math.floor(e.offsetX/tile);
 const y=Math.floor(e.offsetY/tile);
 const i=y*size+x;
 if(tool==='paint') map[layer][i]=1;
 if(tool==='erase') map[layer][i]=0;
 draw();
};

function draw(){
 ctx.clearRect(0,0,320,320);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x;
  if(map.ground[i]){ctx.fillStyle='#6c9';ctx.fillRect(x*tile,y*tile,tile,tile);}
  if(map.objects[i]){ctx.fillStyle='#555';ctx.fillRect(x*tile+8,y*tile+8,16,16);}
  ctx.strokeRect(x*tile,y*tile,tile,tile);
 }
}

function saveMap(){
 const blob=new Blob([JSON.stringify(map)],{type:'application/json'});
 const a=document.createElement('a');
 a.href=URL.createObjectURL(blob);
 a.download='map.json';
 a.click();
}

function loadMap(){fileInput.click()}
function handleLoad(e){
 const r=new FileReader();
 r.onload=()=>{map=JSON.parse(r.result);draw()}
 r.readAsText(e.target.files[0]);
}

draw();

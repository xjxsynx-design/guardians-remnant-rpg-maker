
const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

let gridSize = 15;
let tileSize = 32;
let mode = 'paint';
let selectedTile = '#3fa76a';

let history = [];
let future = [];

function resize() {
  canvas.width = gridSize * tileSize;
  canvas.height = gridSize * tileSize;
  drawGrid();
}

function drawGrid() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let x=0;x<gridSize;x++){
    for(let y=0;y<gridSize;y++){
      ctx.strokeStyle = '#333';
      ctx.strokeRect(x*tileSize,y*tileSize,tileSize,tileSize);
    }
  }
}

function saveState() {
  history.push(ctx.getImageData(0,0,canvas.width,canvas.height));
  if(history.length > 10) history.shift();
  future = [];
}

canvas.addEventListener('click', e => {
  const x = Math.floor(e.offsetX / tileSize) * tileSize;
  const y = Math.floor(e.offsetY / tileSize) * tileSize;
  saveState();
  if(mode === 'paint') {
    ctx.fillStyle = selectedTile;
    ctx.fillRect(x,y,tileSize,tileSize);
  } else {
    ctx.clearRect(x,y,tileSize,tileSize);
  }
  ctx.strokeStyle='#333';
  ctx.strokeRect(x,y,tileSize,tileSize);
});

document.querySelectorAll('.tile').forEach(t=>{
  t.onclick=()=> selectedTile = t.style.background;
});

paintBtn.onclick=()=>{mode='paint'; paintBtn.classList.add('active'); eraseBtn.classList.remove('active');}
eraseBtn.onclick=()=>{mode='erase'; eraseBtn.classList.add('active'); paintBtn.classList.remove('active');}

undoBtn.onclick=()=>{
  if(history.length){
    future.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    ctx.putImageData(history.pop(),0,0);
  }
}

redoBtn.onclick=()=>{
  if(future.length){
    history.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    ctx.putImageData(future.pop(),0,0);
  }
}

clearBtn.onclick=()=>{
  saveState();
  drawGrid();
}

gridSizeSelect = document.getElementById('gridSize');
gridSizeSelect.onchange=()=>{
  gridSize = parseInt(gridSizeSelect.value);
  resize();
}

resize();


const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

let mode = 'paint';
const tileSize = 32;
let cols = 10;
let rows = 10;

function resizeCanvas() {
  const size = Math.min(window.innerWidth - 32, 360);
  cols = Math.floor(size / tileSize);
  rows = cols;
  canvas.width = cols * tileSize;
  canvas.height = rows * tileSize;
  drawGrid();
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#333';
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}

canvas.addEventListener('click', e => {
  const x = Math.floor(e.offsetX / tileSize) * tileSize;
  const y = Math.floor(e.offsetY / tileSize) * tileSize;

  if (mode === 'paint') {
    ctx.fillStyle = '#3fa76a';
    ctx.fillRect(x, y, tileSize, tileSize);
  } else {
    ctx.clearRect(x, y, tileSize, tileSize);
  }
  ctx.strokeStyle = '#333';
  ctx.strokeRect(x, y, tileSize, tileSize);
});

document.getElementById('paintBtn').onclick = () => {
  mode = 'paint';
  paintBtn.classList.add('active');
  eraseBtn.classList.remove('active');
};

document.getElementById('eraseBtn').onclick = () => {
  mode = 'erase';
  eraseBtn.classList.add('active');
  paintBtn.classList.remove('active');
};

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

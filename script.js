
const grid = document.getElementById('grid');
const paintBtn = document.getElementById('paintBtn');
const eraseBtn = document.getElementById('eraseBtn');

let mode = 'paint';

// Create grid cells
for (let i = 0; i < 100; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';

  cell.addEventListener('click', () => {
    if (mode === 'paint') {
      cell.style.background = '#3fa76a';
    } else {
      cell.style.background = '#222';
    }
  });

  grid.appendChild(cell);
}

paintBtn.onclick = () => {
  mode = 'paint';
  paintBtn.classList.add('active');
  eraseBtn.classList.remove('active');
};

eraseBtn.onclick = () => {
  mode = 'erase';
  eraseBtn.classList.add('active');
  paintBtn.classList.remove('active');
};

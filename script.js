const grid = document.getElementById("grid");
const paintBtn = document.getElementById("paintBtn");
const eraseBtn = document.getElementById("eraseBtn");

let mode = "paint";
let isDragging = false;

// Create grid
for (let i = 0; i < 256; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");

  // Click / Tap
  cell.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    isDragging = true;
    applyPaint(cell);
  });

  cell.addEventListener("pointerenter", () => {
    if (isDragging) {
      applyPaint(cell);
    }
  });

  grid.appendChild(cell);
}

// Stop dragging
document.addEventListener("pointerup", () => {
  isDragging = false;
});

function applyPaint(cell) {
  if (mode === "paint") {
    cell.classList.add("filled");
  } else {
    cell.classList.remove("filled");
  }
}

// Tool buttons
paintBtn.addEventListener("click", () => {
  mode = "paint";
  paintBtn.classList.add("active");
  eraseBtn.classList.remove("active");
});

eraseBtn.addEventListener("click", () => {
  mode = "erase";
  eraseBtn.classList.add("active");
  paintBtn.classList.remove("active");
});

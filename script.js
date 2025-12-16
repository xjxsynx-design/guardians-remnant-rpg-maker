const grid = document.getElementById("grid");
const paintBtn = document.getElementById("paintBtn");
const eraseBtn = document.getElementById("eraseBtn");

let mode = "paint";

// Create grid
for (let i = 0; i < 256; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");

  cell.addEventListener("click", () => {
    if (mode === "paint") {
      cell.classList.add("filled");
    } else {
      cell.classList.remove("filled");
    }
  });

  grid.appendChild(cell);
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

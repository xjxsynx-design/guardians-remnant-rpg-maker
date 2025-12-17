const grid = document.getElementById("grid");
const paletteButtons = document.querySelectorAll(".palette button");

let currentTile = "grass";

for (let i = 0; i < 256; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");

  cell.addEventListener("click", () => {
    cell.className = "cell";

    if (currentTile !== "erase") {
      cell.classList.add(currentTile);
    }
  });

  grid.appendChild(cell);
}

paletteButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    paletteButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTile = btn.dataset.tile;
  });
});

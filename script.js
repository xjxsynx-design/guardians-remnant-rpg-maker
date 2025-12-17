const grid = document.getElementById("grid");
const buttons = document.querySelectorAll(".tile-btn");

let currentTile = "grass";

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTile = btn.dataset.tile;
  });
});

for (let i = 0; i < 256; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";

  cell.addEventListener("click", () => {
    cell.className = "cell";
    if (currentTile !== "erase") {
      cell.classList.add(currentTile);
    }
  });

  grid.appendChild(cell);
}

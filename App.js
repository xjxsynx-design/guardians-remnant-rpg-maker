function openTool(tool) {
  const area = document.getElementById("workspace");

  if (tool === "title") {
    area.innerHTML = `
      <h2>Title Screen Editor</h2>
      <input type="file" accept="image/*">
      <br><br>
      <input placeholder="Game Title">
      <br><br>
      <button>Save Title Screen</button>
    `;
  } else {
    area.innerHTML = `<h2>${tool} coming soon</h2>`;
  }
}

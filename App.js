const content = document.getElementById("content");

function showProjects() {
  content.innerHTML = `
    <h2>Projects</h2>
    <p>Welcome to Guardians’ Remnant RPG Maker.</p>
    <button onclick="createProject()">Create New Project</button>
  `;
}

function showEditor() {
  content.innerHTML = `
    <h2>Editor</h2>
    <p>Select a tool from the editor menu.</p>
  `;
}

function showTitleScreen() {
  content.innerHTML = `
    <h2>Title Screen Editor</h2>
    <p>Upload a background image and set your game title.</p>

    <input type="file" accept="image/*" />
    <br /><br />
    <input type="text" placeholder="Game Title" />
  `;
}

function showPlay() {
  content.innerHTML = `
    <h2>Play</h2>
    <p>Playtesting coming soon.</p>
  `;
}

function createProject() {
  alert("Project created!");
}

// Load default view
showProjects();

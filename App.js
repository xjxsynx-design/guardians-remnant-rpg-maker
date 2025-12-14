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
function openTool(tool) {
  const main = document.getElementById('main');

  if (!main) {
    alert('Main container not found');
    return;
  }

  switch (tool) {
    case 'projects':
      main.innerHTML = '<h2>Projects</h2><p>Projects editor coming next.</p>';
      break;

    case 'editor':
      main.innerHTML = '<h2>Editor</h2><p>Main editor coming next.</p>';
      break;

    case 'title':
      main.innerHTML = '<h2>Title Screen</h2><p>Title Screen Editor loaded.</p>';
      break;

    case 'play':
      main.innerHTML = '<h2>Play</h2><p>Game preview coming soon.</p>';
      break;

    default:
      main.innerHTML = '<p>Unknown tool.</p>';
  }
}



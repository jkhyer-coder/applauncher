// ------------------------------
// Global Variables
// ------------------------------
let installedApps = JSON.parse(localStorage.getItem("installedApps")) || [];
let openApps = [];
let zIndex = 1;

const taskbarApps = document.getElementById("taskbar-apps");
const startMenu = document.getElementById("start-menu");

// ------------------------------
// Fetch app data
// ------------------------------
let appData;
fetch("apps.json")
  .then(res => res.json())
  .then(data => {
    appData = data;

    // Add preinstalled apps
    data.sections.forEach(section => {
      section.apps.forEach(app => {
        if (app.preinstalled && !installedApps.find(a => a.title === app.title)) {
          installedApps.push(app);
        }
      });
    });

    saveApps();
    renderDesktop();

    // Restore previously opened windows
    const savedWins = JSON.parse(localStorage.getItem("windowPositions")) || [];
    savedWins.forEach(data => {
      const app = installedApps.find(a => a.title === data.title);
      if (!app) return;
      const win = createWindow(app);
      win.style.left = data.left + "px";
      win.style.top = data.top + "px";
      win.style.width = data.width + "px";
      win.style.height = data.height + "px";
      document.body.appendChild(win);
      openApps.push({ app, win });
    });
    renderTaskbar();
  });

// ------------------------------
// Save installed apps
// ------------------------------
function saveApps() {
  localStorage.setItem("installedApps", JSON.stringify(installedApps));
}

// ------------------------------
// Desktop Rendering + Drag
// ------------------------------
function renderDesktop() {
  const desktop = document.getElementById("desktop");
  desktop.innerHTML = "";

  // Load saved icon positions
  const positions = JSON.parse(localStorage.getItem("iconPositions")) || {};

  installedApps.forEach(app => {
    const div = document.createElement("div");
    div.className = "icon";
    div.dataset.name = app.title;
    div.innerHTML = `<img src="${app.icon}"><br>${app.title}`;

    if (positions[app.title]) {
      div.style.position = "absolute";
      div.style.left = positions[app.title].x + "px";
      div.style.top = positions[app.title].y + "px";
    }

    // Drag logic
    div.onmousedown = e => {
      div.classList.add("dragging");
      const startX = e.pageX - (parseInt(div.style.left) || 0);
      const startY = e.pageY - (parseInt(div.style.top) || 0);

      document.onmousemove = e2 => {
        div.style.position = "absolute";
        div.style.left = e2.pageX - startX + "px";
        div.style.top = e2.pageY - startY + "px";
      };

      document.onmouseup = () => {
        div.classList.remove("dragging");
        document.onmousemove = null;
        positions[app.title] = { x: parseInt(div.style.left), y: parseInt(div.style.top) };
        localStorage.setItem("iconPositions", JSON.stringify(positions));
      };
    };

    div.onclick = () => openWindow(app);
    desktop.appendChild(div);
  });

  // Render desktop folders
  ["Desktop", "Downloads"].forEach(folderName => {
    const folder = document.createElement("div");
    folder.className = "folder";
    folder.innerHTML = `<img src="icons/folder.png"><br>${folderName}`;
    folder.onclick = () => alert(`${folderName} folder clicked`);
    desktop.appendChild(folder);
  });
}

// ------------------------------
// Create Window (used for new & restored windows)
// ------------------------------
function createWindow(app) {
  const win = document.createElement("div");
  win.className = "window";
  win.style.zIndex = ++zIndex;

  win.innerHTML = `
    <div class="titlebar">
      <span>${app.title}</span>
      <div>
        <button class="minimize">—</button>
        <button class="fullscreen">⬜</button>
        <button class="close">X</button>
      </div>
    </div>
    <iframe src="${app.src}"></iframe>
  `;

  const bar = win.querySelector(".titlebar");

  // Drag window
  let offsetX, offsetY;
  bar.onmousedown = e => {
    offsetX = e.offsetX;
    offsetY = e.offsetY;

    document.onmousemove = e2 => {
      win.style.left = e2.pageX - offsetX + "px";
      win.style.top = e2.pageY - offsetY + "px";
    };

    document.onmouseup = () => document.onmousemove = null;
  };

  // Focus
  win.onclick = () => win.style.zIndex = ++zIndex;

  // Close
  win.querySelector(".close").onclick = () => {
    win.remove();
    openApps = openApps.filter(o => o.win !== win);
    renderTaskbar();
    saveWindowPositions();
  };

  // Fullscreen
  win.querySelector(".fullscreen").onclick = () => {
    win.classList.toggle("fullscreen");
    win.classList.remove("snapped-left", "snapped-right", "snapped-top");
    saveWindowPositions();
  };

  // Minimize
  win.querySelector(".minimize").onclick = () => {
    win.classList.toggle("minimized");
    saveWindowPositions();
  };

  // Snap windows with arrow keys
  document.addEventListener("keydown", e => {
    if (document.activeElement.tagName === "IFRAME") return;
    if (win.style.zIndex != zIndex) return;

    if (e.key === "ArrowLeft") {
      win.classList.remove("fullscreen", "snapped-right", "snapped-top");
      win.classList.add("snapped-left");
      saveWindowPositions();
    }
    if (e.key === "ArrowRight") {
      win.classList.remove("fullscreen", "snapped-left", "snapped-top");
      win.classList.add("snapped-right");
      saveWindowPositions();
    }
    if (e.key === "ArrowUp") {
      win.classList.remove("fullscreen", "snapped-left", "snapped-right");
      win.classList.add("snapped-top");
      saveWindowPositions();
    }
  });

  return win;
}

// ------------------------------
// Open Window (adds to DOM + taskbar)
// ------------------------------
function openWindow(app) {
  const win = createWindow(app);
  document.body.appendChild(win);
  openApps.push({ app, win });
  renderTaskbar();
  saveWindowPositions();
}

// ------------------------------
// Taskbar Rendering
// ------------------------------
function renderTaskbar() {
  taskbarApps.innerHTML = "";

  openApps.forEach(({ app, win }) => {
    const item = document.createElement("div");
    item.className = "taskbar-item";
    item.textContent = app.title;

    item.onclick = () => {
      win.classList.remove("minimized");
      win.style.zIndex = ++zIndex;
    };

    taskbarApps.appendChild(item);
  });
}

// ------------------------------
// Start Menu
// ------------------------------
document.getElementById("start-btn").onclick = () => {
  startMenu.style.display = startMenu.style.display === "flex" ? "none" : "flex";
  renderStartMenu();
};

function renderStartMenu() {
  startMenu.innerHTML = "";

  installedApps.forEach(app => {
    const item = document.createElement("div");
    item.className = "start-item";
    item.textContent = app.title;
    item.onclick = () => { openWindow(app); startMenu.style.display = "none"; };
    startMenu.appendChild(item);
  });

  const store = document.createElement("div");
  store.className = "start-item";
  store.textContent = "App Store";
  store.onclick = () => { openWindow({ title: "App Store", src: "apps/appstore.html" }); startMenu.style.display = "none"; };
  startMenu.appendChild(store);
}

// ------------------------------
// Clock
// ------------------------------
const clock = document.createElement("div");
clock.id = "taskbar-clock";
document.getElementById("taskbar").appendChild(clock);

function updateClock() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2,"0");
  const m = String(d.getMinutes()).padStart(2,"0");
  const s = String(d.getSeconds()).padStart(2,"0");
  clock.textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ------------------------------
// Install App
// ------------------------------
function installApp(app) {
  if (confirm(`Install ${app.title}?`)) {
    installedApps.push(app);
    saveApps();
    renderDesktop();
  }
}

// ------------------------------
// Delete App
// ------------------------------
function deleteApp(name) {
  installedApps = installedApps.filter(a => a.title !== name);
  saveApps();
  renderDesktop();
}

// ------------------------------
// Right-Click Menu
// ------------------------------
document.addEventListener("contextmenu", e => {
  e.preventDefault();

  const target = e.target.closest(".icon");
  if (!target) return;

  const name = target.dataset.name;
  const app = installedApps.find(a => a.title === name);

  const menu = document.createElement("div");
  menu.className = "context-menu";

  menu.innerHTML = `
    <div onclick='openWindow(${JSON.stringify(app)})'>Open</div>
    ${!app.preinstalled ? `<div onclick="deleteApp('${app.title}')">Delete</div>` : ""}
  `;

  menu.style.top = e.pageY + "px";
  menu.style.left = e.pageX + "px";

  document.body.appendChild(menu);

  document.onclick = () => menu.remove();
});

// ------------------------------
// Save & Restore Window Positions
// ------------------------------
function saveWindowPositions() {
  localStorage.setItem(
    "windowPositions",
    JSON.stringify(openApps.map(o => {
      const rect = o.win.getBoundingClientRect();
      return { title: o.app.title, left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }))
  );
}

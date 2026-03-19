let openApps = [];
const taskbarApps = document.getElementById("taskbar-apps");
const startMenu = document.getElementById("start-menu");
let installedApps = JSON.parse(localStorage.getItem("installedApps")) || [];
let zIndex = 1;

// Load apps.json
let appData;

fetch("apps.json")
  .then(res => res.json())
  .then(data => {
    appData = data;

    data.sections.forEach(section => {
      section.apps.forEach(app => {
        if (app.preinstalled && !installedApps.find(a => a.title === app.title)) {
          installedApps.push(app);
        }
      });
    });

    saveApps();
    renderDesktop();
  });

function saveApps() {
  localStorage.setItem("installedApps", JSON.stringify(installedApps));
}
// Clock in taskbar
const clock = document.createElement("div");
clock.id = "taskbar-clock";
document.getElementById("taskbar").appendChild(clock);

function updateClock() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  clock.textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// Enhanced openWindow with minimize + snap
function openWindow(app) {
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

  document.body.appendChild(win);
  openApps.push({ app, win });
  renderTaskbar();

  const bar = win.querySelector(".titlebar");

  // Drag
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
  };

  // Fullscreen
  win.querySelector(".fullscreen").onclick = () => {
    win.classList.toggle("fullscreen");
    win.classList.remove("snapped-left", "snapped-right", "snapped-top");
  };

  // Minimize
  win.querySelector(".minimize").onclick = () => {
    win.classList.toggle("minimized");
  };

  // Snap windows with arrow keys
  document.addEventListener("keydown", e => {
    if (document.activeElement.tagName === "IFRAME") return;
    if (win.style.zIndex != zIndex) return;

    if (e.key === "ArrowLeft") {
      win.classList.remove("fullscreen", "snapped-right", "snapped-top");
      win.classList.add("snapped-left");
    }
    if (e.key === "ArrowRight") {
      win.classList.remove("fullscreen", "snapped-left", "snapped-top");
      win.classList.add("snapped-right");
    }
    if (e.key === "ArrowUp") {
      win.classList.remove("fullscreen", "snapped-left", "snapped-right");
      win.classList.add("snapped-top");
    }
  });
}
// Desktop
function renderDesktop() {
  const desktop = document.getElementById("desktop");
  desktop.innerHTML = "";

  installedApps.forEach(app => {
    const icon = document.createElement("div");
    icon.className = "icon";
    icon.dataset.name = app.title;

    icon.innerHTML = `<img src="${app.icon}"><br>${app.title}`;

    icon.onclick = () => openWindow(app);

    desktop.appendChild(icon);
  });
}
function renderTaskbar() {
  taskbarApps.innerHTML = "";

  openApps.forEach(({ app, win }) => {
    const item = document.createElement("div");
    item.className = "taskbar-item";
    item.textContent = app.title;

    item.onclick = () => {
      win.style.zIndex = ++zIndex;
    };

    taskbarApps.appendChild(item);
  });
}
// Toggle start menu
document.getElementById("start-btn").onclick = () => {
  startMenu.style.display =
    startMenu.style.display === "flex" ? "none" : "flex";
  renderStartMenu();
};

// Render start menu
function renderStartMenu() {
  startMenu.innerHTML = "";

  installedApps.forEach(app => {
    const item = document.createElement("div");
    item.className = "start-item";
    item.textContent = app.title;

    item.onclick = () => {
      openWindow(app);
      startMenu.style.display = "none";
    };

    startMenu.appendChild(item);
  });

  // App Store shortcut
  const store = document.createElement("div");
  store.className = "start-item";
  store.textContent = "App Store";
  store.onclick = () => {
    openWindow({ title: "App Store", src: "apps/appstore.html" });
    startMenu.style.display = "none";
  };

  startMenu.appendChild(store);
}
// Window system
function openWindow(app) {
  const win = document.createElement("div");
  win.className = "window";
  win.style.zIndex = ++zIndex;

  win.innerHTML = `
    <div class="titlebar">
      <span>${app.title}</span>
      <div>
        <button class="fullscreen">⬜</button>
        <button class="close">X</button>
      </div>
    </div>
    <iframe src="${app.src}"></iframe>
  `;

  document.body.appendChild(win);

  // Track open apps
  openApps.push({ app, win });
  renderTaskbar();

  // Drag
  let offsetX, offsetY;
  const bar = win.querySelector(".titlebar");

  bar.onmousedown = e => {
    offsetX = e.offsetX;
    offsetY = e.offsetY;

    document.onmousemove = e2 => {
      win.style.left = e2.pageX - offsetX + "px";
      win.style.top = e2.pageY - offsetY + "px";
    };

    document.onmouseup = () => {
      document.onmousemove = null;
    };
  };

  // Focus
  win.onclick = () => win.style.zIndex = ++zIndex;

  // Close
  win.querySelector(".close").onclick = () => {
    win.remove();
    openApps = openApps.filter(o => o.win !== win);
    renderTaskbar();
  };

  // Fullscreen
  win.querySelector(".fullscreen").onclick = () => {
    win.classList.toggle("fullscreen");
  };
}

// Install app
function installApp(app) {
  if (confirm(`Install ${app.title}?`)) {
    installedApps.push(app);
    saveApps();
    renderDesktop();
  }
}

// Delete app
function deleteApp(name) {
  installedApps = installedApps.filter(a => a.title !== name);
  saveApps();
  renderDesktop();
}

// Right-click menu
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

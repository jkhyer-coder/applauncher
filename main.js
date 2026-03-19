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

  // Focus (z-index stacking)
  win.onclick = () => win.style.zIndex = ++zIndex;

  // Close
  win.querySelector(".close").onclick = () => win.remove();

  // Fullscreen
  win.querySelector(".fullscreen").onclick = () => {
    win.classList.toggle("fullscreen");
  };

  document.body.appendChild(win);
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

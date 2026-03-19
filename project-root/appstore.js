function toggleAppSwitcher() {
  const existingSwitcher = document.getElementById("app-switcher");

  if (!appSwitcherActive) {
    // Create overlay
    const switcher = document.createElement("div");
    switcher.id = "app-switcher";

    openApps.forEach((app) => {
      const el = document.createElement("div");
      el.className = "switcher-app";

      // App preview content
      el.innerHTML = `
        <img src="${app.icon}" alt="${app.title}" />
        <div class="switcher-app-title">${app.title}</div>
      `;

      // Click preview to open full-screen
      el.onclick = () => {
        openApp(app);
        toggleAppSwitcher(); // close switcher
      };

      switcher.appendChild(el);
    });

    document.body.appendChild(switcher);
    appSwitcherActive = true;

    // Hide home screen and current app
    homeScreen.style.display = "none";
    appContainer.style.display = "none";
  } else {
    // Close switcher
    if (existingSwitcher) existingSwitcher.remove();
    appSwitcherActive = false;

    // Return to home if no app is active
    if (!appContainer.hasChildNodes()) {
      homeScreen.style.display = "grid";
    } else {
      appContainer.style.display = "flex";
    }
  }
}

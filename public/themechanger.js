const themeChanger = document.querySelector(".theme-changer");  // Fixed name
const mainBody = document.querySelector(".main-body");           // document instead of window
const navBar = document.querySelector(".nav-bar");
const bluetoothConnector = document.querySelector(".bluetooth-connector");
const info=document.querySelector(".info");

function switchTheme() {
    // Toggling classes for dark theme
    mainBody.classList.toggle("dark-theme");
    navBar.classList.toggle("dark-theme");
    bluetoothConnector.classList.toggle("dark-theme"); 
    info.classList.toggle("dark-theme");

    // Switching between sun and moon icons
    if (mainBody.classList.contains("dark-theme")) {
        themeChanger.classList.remove('fa-moon');
        themeChanger.classList.add('fa-sun');
        themeChanger.classList.add('dark-theme');
    } else {
        themeChanger.classList.remove('fa-sun');
        themeChanger.classList.remove('dark-theme');
        themeChanger.classList.add('fa-moon');
    }
}

// Add event listener to switch theme on click
themeChanger.addEventListener("click", switchTheme);

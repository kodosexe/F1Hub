// All of the Node.js APIs are available in the preload process.
const electron = require('electron');
const { ipcRenderer, ipcMain, net } = require("electron");

function init() {
    window.isElectron = true;
    window.ipcRenderer = ipcRenderer;
}

// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const type of ['chrome', 'node', 'electron']) {
      replaceText(`${type}-version`, process.versions[type])
    }
    
    document.getElementById('close').addEventListener('click', () => {
        ipcRenderer.invoke("close-wins");
    });
/*
    document.getElementById('testStream').addEventListener('click', () => {
        ipcRenderer.invoke("test-play");
    });
*/

    document.getElementById("loginform").addEventListener("submit", (event) => {
        event.preventDefault();
        //var data = [document.getElementById("email").value, document.getElementById("password").value];
        console.log("Login Request sent");
        ipcRenderer.invoke('login');
    })

    document.getElementById("playbyid").addEventListener("submit", (event) => {
        event.preventDefault();
        var data = document.getElementById("id").value;
        ipcRenderer.send('playByID', data);
    });

    var elements = document.getElementsByClassName("selElement");
    console.log("elements gotten: " + elements.length)
    for (var i=0; i < elements.length; i++) {
        //elements[i].
    }

    ipcRenderer.invoke("domLoaded");
})
init();

// Start Clock Selector
const electron = require('electron');
const { ipcRenderer, ipcMain, net } = require("electron");
var drag = require('electron-drag');

var clear;
function init() {
    window.isElectron = true;
    window.ipcRenderer = ipcRenderer;
}

window.addEventListener('DOMContentLoaded', () => {
    clear = drag('#dragger');

    if (!drag.supported) {
        document.querySelector('#dragger').style['-webkit-app-region'] = 'drag'
    }
});

window.addEventListener('resize', function(event) {
    //console.log("Resizing")
    //this.document.getElementById("video").style.height = this.window.innerHeight;
    //this.document.getElementById("video").style.width = this.window.innerWidth;
})

init();

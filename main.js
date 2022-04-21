const electron = require('electron');
const { app, BrowserWindow, ipcMain, ipcRenderer, net } = require('electron')
const {session} = require('electron');
const { arch } = require('os');
const path = require('path')
var API = require('./api.js');
var MTN = require('./menuTreeNode.js');
var AscendonToken = "";
var EntitlementToken = "";
var reeseCookie = "";
var euCookie = "";
//const ipcMain = electron.ipcMain;
let window;
let loginWin;
let playWindows = [];
let channelOptions = [];

const debug = true;
var f1api;

var menuNodes = [];

var chanOpt = {
    "playUrl": "xyz.com",
    "name": "Lewis Hamilton"
}

app.whenReady().then(() => {
    window = new BrowserWindow({
        width: 1200,
        height: 750,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
    //apiObj = new API();
    window.loadFile('index.html')
    f1api = new API(debug, window);
    // Setup basic menu nodes:
    var liveNode = new MTN("live", "", "Live", "livelist", false, "");
    var currentSeasonNode = new MTN(String(f1api.currentSeasonId), "", "2022 Season", "2022Season", false, "https://f1tv.formula1.com/2.0/R/ENG/WEB_DASH/ALL/PAGE/4319/F1_TV_Pro_Monthly/14");
    var archiveNode = new MTN(String(f1api.archiveId), "", "Archive", "mainpage", false, "https://f1tv.formula1.com/2.0/R/ENG/WEB_DASH/ALL/PAGE/493/F1_TV_Pro_Monthly/14");
    var showsNode = new MTN(String(f1api.showsId), "", "Shows", "mainpage", false, "https://f1tv.formula1.com/2.0/R/ENG/WEB_DASH/ALL/PAGE/410/F1_TV_Pro_Monthly/14");
    var docsNode = new MTN(String(f1api.documentariesId), "", "Documentaries", "mainpage", false, "https://f1tv.formula1.com/2.0/R/ENG/WEB_DASH/ALL/PAGE/413/F1_TV_Pro_Monthly/14");
    menuNodes.push(liveNode);
    menuNodes.push(currentSeasonNode);
    menuNodes.push(archiveNode);
    menuNodes.push(showsNode);
    menuNodes.push(docsNode);
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

ipcMain.on("button-clicked", (event, data) => console.log(data))

ipcMain.handle("domLoaded", () => {
    getCookies();
    pollForLive();
})

ipcMain.handle("close-wins", () => {
    app.quit();
});

// End Boilerplate

// data = contentId
ipcMain.on("playByID", function(event, data) {
    channelOptions = [];
    var id = data;
    channelOptions = f1api.playByID(id);

    for (var i = 0; i < channelOptions.length; i++) {
        window.webContents.send("streamAppend", channelOptions[i]);
    }
});

function getTokenizedUrlAndPlay(finalizedUrl) {
    const request = f1api.getTokenizedUrlAndPlay(finalizedUrl);
    request.on('response', (response) => {
        response.on('data', (chunk) => {

            var res = JSON.parse(chunk);
            console.log(res);
            //url = res.resultObj.url;
            if (response.statusCode === 200) {
                if (res.resultObj.streamType === "HLS") {
                    console.log(res.resultObj.url);
                    playWindowHls(res.resultObj.url);
                } else {
                    playWindowDrm(res.resultObj.url, res.resultObj.laURL);
                }
            } else {
                console.log("Error retrieving stream. Code " + response.statusCode);
            }
        });
    });
    request.on('error', (error) => {
        console.log('ERROR (RAW): ' + error);
        return ({ "StreamType": "NONE" });
    });
}

function getCookies() {
    session.defaultSession.cookies.get({name: "login-session"})
        .then((cookies) => {
            //console.log(cookies);
            if (cookies.length === 1) {
                AscendonToken = cookies[0].value.substring(48, cookies[0].value.length-9);
                //window.webContents.send("loginSuccess", "Unkown");
                session.defaultSession.cookies.get({name: "reese84"})
                .then((reeseCookie) => {
                    if(reeseCookie.length === 1) {
                        reeseCookie = reeseCookie[0].value;
                        //console.log("Reese Cookie:" + reeseCookie);
                        session.defaultSession.cookies.get({name: "euconsent-v2"})
                        .then((euCookies) => {
                            if (euCookies.length === 1) {
                                euCookie = euCookies[0].value;
                                //console.log("Eu Cookie:" + euCookie);
                                if (f1api.authenticate(AscendonToken, reeseCookie, euCookie)) {
                                    console.log("Sending success message");
                                    window.webContents.send("loginSuccess", "Unkown");
                                }
                            }
                        }).catch((error) => {console.log("Error EUConsent: " + error)});
                    }
                }).catch((error) => {console.log("Error Reese: " + error)});
            }
        }).catch((error) => { console.log("Error Ascendon: " + error); });
        //e.returnValue = true;
}

function playWindowHls(url) {
    const remote = require('electron').remote;
    var clear;
    var playerWindow = new BrowserWindow({
        width: 640,
        height: 360,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        roundedCorners: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preloadPlayer.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    playerWindow.setAspectRatio(1.777777);

    playerWindow.on('resize', function () {
        setTimeout(function() {
            //var size = playerWindow.getSize();
            //playerWindow.setSize(size[0], parseInt(size[0] *9/16));
        }, 0);
    })

    playerWindow.on('ready-to-show', function () {
        playerWindow.webContents.send("playSrcHls", url);
    });

    playerWindow.loadFile('player.html');

    console.log("Invoked")
    playWindows.push(playerWindow);
}

function playWindowDrm(url, laurl) {
    console.log(url + ', ' + laurl);
    const remote = require('electron').remote;
    var clear;
    var playerWindow = new BrowserWindow({
        width: 640,
        height: 360,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        roundedCorners: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preloadPlayer.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    playerWindow.setAspectRatio(1.777777);

    playerWindow.on('resize', function () {
    })

    playerWindow.on('ready-to-show', function () {
        data = [url, f1api.getWidevineLicense(laurl)];
        playerWindow.webContents.send("playSrcDrm", data);
    });

    playerWindow.loadFile('player.html');

    console.log("Invoked")
    playWindows.push(playerWindow);
}

function loginWindow() {
    const remote = require('electron').remote;
    loginWin = new BrowserWindow({
        width: 1200,
        height: 750,
    });
    loginWin.loadURL('https://account.formula1.com/#/en/login');

    loginWin.on('close', (e) => {
        //console.log("Unloaded");
            session.defaultSession.cookies.get({name: "login-session"})
            .then((cookies) => {
                //console.log(cookies);
                if (cookies.length === 1) {
                    AscendonToken = cookies[0].value.substring(48, cookies[0].value.length-9);
                    //window.webContents.send("loginSuccess", "Unkown");
                    session.defaultSession.cookies.get({name: "reese84"})
                    .then((reeseCookie) => {
                        if(reeseCookie.length === 1) {
                            reeseCookie = reeseCookie[0].value;
                            //console.log("Reese Cookie:" + reeseCookie);
                            session.defaultSession.cookies.get({name: "euconsent-v2"})
                            .then((euCookies) => {
                                if (euCookies.length === 1) {
                                    euCookie = euCookies[0].value;
                                    //console.log("Eu Cookie:" + euCookie);
                                    if (f1api.authenticate(AscendonToken, reeseCookie, euCookie)) {
                                        window.webContents.send("loginSuccess", "Unkown");
                                    }
                                }
                            }).catch((error) => {console.log("Error EUConsent: " + error)});
                        }
                    }).catch((error) => {console.log("Error Reese: " + error)});
                }
            }).catch((error) => { console.log("Error Ascendon: " + error); });
            //e.returnValue = true;
    });
}

ipcMain.on('playLoadedStream', (event, data) => {
    var elem = channelOptions[data];
    getTokenizedUrlAndPlay(elem.playUrl);
});

ipcMain.on('nodeClicked', (event, data) => {
    channelOptions = [];
    var node = getNodeById(data);
    console.log("Element selected: " + node.displayName);

    if(node.type !== "stream") {
        getNodes(getNodeById(data));
    } else {
        f1api.playByID(data, window, channelOptions);
    }
});

ipcMain.handle("login", () => {
    console.log("Login Clicked")
    window.webContents.send("loginStart", "");
    loginWindow();
});

function pollForLive() {
    if(debug) {
        console.log("=======");
        console.log("= Sending net request to " + f1api.f1tvHomeUrl)
        console.log("= To check for live session");
    }
    const request = net.request({
        method: 'GET',
        protocol: 'https:',
        hostname: 'f1tv.formula1.com',
        path: f1api.f1tvHomeUrl,
        redirect: 'follow'
    });
    request.on('response', (response) => {
        //console.log('STATUS: ' + response.statusCode);
        response.on('data', (chunk) => {
            //console.log('BODY: ' + chunk)
            try {
                var res = JSON.parse(chunk);
            } catch {
                if(this.debug) {
                    console.log("= Could not scan JSON. Response:")
                    console.log(chunk);
                    console.log("=======\n\n");
                    return;
                }
            }
            if (response.statusCode === 200) {
                var elementToCheck = res.resultObj.containers[0].retrieveItems.resultObj.containers[0].platformVariants[0].technicalPackages[0].packageType;
                var elementId = res.resultObj.containers[0].retrieveItems.resultObj.containers[0].id;
                var elementTitle = res.resultObj.containers[0].retrieveItems.resultObj.containers[0].metadata.title;
                if (elementToCheck === "SVOD") {
                    console.log("Live!, ID " + elementId);
                    window.webContents.send('liveDetected', elementId);
                    var liveChildNode = new MTN(elementId, "live", elementTitle, "stream", true, "");
                    menuNodes.push(liveChildNode);
                    getNodeById("live").children.push(liveChildNode);
                }
            } else {
                console.log(res);
            }
        });
        if(this.debug)
            console.log("= Success\n=======\n\n");
    });
    request.on('error', (error) => {
        console.log('ERROR: ' + JSON.stringify(error));
    });
    request.on('close', (error) => {
        //console.log('Last transaction has occured.')
    });
    request.setHeader('User-Agent', 'RaceControl f1viewer');
    request.setHeader('apiKey', 'fCUCjWrKPu9ylJwRAv8BpGLEgiAuThx7');
    request.setHeader('Cookies', f1api.assembleCookie());
    request.end();
}

function getNodeById(id) {
    for(var i = 0; i < menuNodes.length; i++) {
        if (menuNodes[i].id === String(id)) {
            return menuNodes[i];
        }
    }
    return {};
}

function getNodes(parentnode) {
    if(parentnode.children.length > 0) {
        tabObjects = [];
        for(var i = 0; i < parentnode.children.length; i++) {
            tabObjects.push({"name": parentnode.children[i].displayName, "id": parentnode.children[i].id});
        }
        window.webContents.send("newTab", tabObjects);
        return;
    }

    if(debug) {
        console.log("=======");
        console.log("= Sending net request to " + f1api.f1tvPageUrlP1 + parentnode.id + f1api.f1tvPageUrlP2);
        console.log("= in main.js -> getNodes()");
    }

    const request = net.request({
        method: 'GET',
        protocol: 'https:',
        hostname: 'f1tv.formula1.com',
        path: f1api.f1tvPageUrlP1 + parentnode.id + f1api.f1tvPageUrlP2,
        redirect: 'follow'
    });
    request.on('response', (response) => {
        response.on('data', (chunk) => {
            try {
                var res = JSON.parse(chunk);
            } catch {
                if(debug) {
                    console.log("= Could not parse response:");
                    console.log(chunk);
                    return;
                }
            }
            //console.log(res);
            tabObjects = [];
            if (response.statusCode === 200) {
                if(debug)
                    console.log("= Status: Success!");


                if(parentnode.type === "2022Season") {
                    var amountContainers = res.resultObj.total;
                    for(var i=0; i < amountContainers; i++) {
                        if(res.resultObj.containers[i].layout !== "horizontal_thumbnail") {
                            continue;
                        }

                        var parentElement = res.resultObj.containers[i];
                        for(var j=0; j < parentElement.retrieveItems.resultObj.total; j++) {
                            var element = res.resultObj.containers[i].retrieveItems.resultObj.containers[j].metadata;
                            var node = new MTN(String(element.emfAttributes.PageID), parentnode.id, element.longDescription, "event", false, "");
                            tabObjects.push({"name": node.displayName, "id": node.id});
                            console.log("Adding: " + node.displayName);
                            parentnode.children.push(node);
                            menuNodes.push(node);

                        }
                    }
                    window.webContents.send("newTab", tabObjects);
                } else if(parentnode.type === "event") {
                    var element = res.resultObj.containers;
                    for(var i = 0; i < element.length; i++) {
                        if(element[i].metadata.label !== null) {
                            var node = new MTN(''+parentnode.id+i, parentnode, element[i].metadata.label, "eventCategory", false, "");
                            for(var j = 0; j < element[i].retrieveItems.resultObj.total; j++) {
                                var childElement = element[i].retrieveItems.resultObj.containers[j];
                                var childNode = new MTN(String(childElement.id), node.id, childElement.metadata.titleBrief, "stream", true, "");
                                node.children.push(childNode);
                                menuNodes.push(childNode);
                            }
                            tabObjects.push({"name": node.displayName, "id": node.id});
                            menuNodes.push(node);
                        }
                    }
                    window.webContents.send("newTab", tabObjects);
                }
            }
            console.log("=======\n\n");
    });
    });
    request.on('error', (error) => {
        console.log('= ERROR: ' + JSON.stringify(error))
        return false;
    });
    request.on('close', (error) => {
        console.log('= Last transaction has occured.')
    });
    request.setHeader('User-Agent', 'RaceControl f1viewer');
    request.setHeader('Accept', '*');
    request.setHeader('AscendonToken', f1api.AscendonToken);
    request.setHeader('EntitlementToken', f1api.EntitlementToken);
    request.setHeader('session-id', 'WEB-15a35481-ea2a-4bd0-8b96-6b8acfbdde39');
    request.setHeader('Connection', 'keep-alive');
    request.setHeader('Cookie', f1api.assembleCookie());
    request.end();
}
/*
function getPageNodes(id) {
    const request = net.request({
        method: 'GET',
        protocol: 'https:',
        hostname: 'f1tv.formula1.com',
        path: f1api.f1tvPageUrlP1 + id + f1api.f1tvPageUrlP2,
        redirect: 'follow'
    });
    request.on('response', (response) => {
        response.on('data', (chunk) => {
            var res = JSON.parse(chunk);
            console.log(res);
            tabObjects = [];
            if (response.statusCode === 200) {
                // containers[0] is the hero, lists current event?
                // Containers[4] is interesting, lists all previous races
                var container1 = res.resultObj.containers[4].retrieveItems.resultObj;
                for(var i = 0; i < container1.total; i++) {
                    var element = container1.containers[i].metadata;
                    var node = new MTN(element.emfAttributes.PageID, id, element.titleBrief, "event", false, "");
                    tabObjects.push({'name': element.titleBrief, 'id': element.emfAttributes.PageID});
                    menuNodes.push(node);
                }

                var container2 = res.resultObj.containers[0].retrieveItems.resultObj.containers[0].metadata;
                var node = new MTN(container2.emfAttributes.PageID, id, "event", container2.titleBrief, false, "");
                tabObjects.push({'name': container2.titleBrief, 'id': container2.emfAttributes.PageID});
                menuNodes.push(node);

                window.webContents.send("newTab", tabObjects);
            }
    });
    });
    request.on('error', (error) => {
        console.log('ERROR: ' + JSON.stringify(error))
        return false;
    });
    request.on('close', (error) => {
        console.log('Last transaction has occured.')
    });
    request.setHeader('User-Agent', 'RaceControl f1viewer');
    request.setHeader('Accept', '*');
    request.setHeader('AscendonToken', f1api.AscendonToken);
    request.setHeader('EntitlementToken', f1api.EntitlementToken);
    request.setHeader('session-id', 'WEB-15a35481-ea2a-4bd0-8b96-6b8acfbdde39');
    request.setHeader('Connection', 'keep-alive');
    request.setHeader('Cookie', f1api.assembleCookie());
    request.end();
}*/
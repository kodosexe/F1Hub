// F1TV API Module
const electron = require('electron');
const { net } = require('electron')

class API {
    constructor(debug, window) {
        this.window = window;
        this.debug = debug;
        this.AscendonToken = "";
        this.EntitlementToken = "";
        this.reeseCookie = "";
        this.euCookie = "";
        this.f1tvAuthUrl = '/v2/account/subscriber/authenticate/by-password';
        this.f1tvPlayUrl = '/2.0/R/ENG/BIG_SCREEN_HLS/ALL/CONTENT/PLAY?'; // channelId=1033&contentId=xxxxx
        this.f1tvHomeUrl = '/2.0/R/ENG/WEB_DASH/ALL/PAGE/395/F1_TV_Pro_Monthly/14';
        this.f1tvPageUrlP1 = '/2.0/R/ENG/WEB_DASH/ALL/PAGE/';
        this.f1tvPageUrlP2 = '/F1_TV_Pro_Monthly/14'
        this.f1tvGetStreamChannelsP1 = '/3.0/R/ENG/WEB_DASH/ALL/CONTENT/VIDEO/';
        this.f1tvGetStreamChannelsP2 = '/F1_TV_Pro_Monthly/14?contentId=';
        this.f1tvPlayFirstPart = '/2.0/R/ENG/BIG_SCREEN_HLS/ALL/';

        // Some common ids:
        this.currentSeasonId = 4319;
        this.archiveId = 493;
        this.showsId = 410;
        this.documentariesId = 413;

        // Homepage Nav URLs
        this.currentSeasonUrl = "https://f1tv.formula1.com/2.0/R/ENG/WEB_DASH/ALL/PAGE/4319/F1_TV_Pro_Monthly/14";
        this.archiveUrl = "https://f1tv.formula1.com/2.0/R/ENG/WEB_DASH/ALL/PAGE/493/F1_TV_Pro_Monthly/14";
        this.showsUrl = "https://f1tv.formula1.com/2.0/R/ENG/WEB_DASH/ALL/PAGE/410/F1_TV_Pro_Monthly/14";
        this.documentariesUrl = "https://f1tv.formula1.com/2.0/R/ENG/WEB_DASH/ALL/PAGE/413/F1_TV_Pro_Monthly/14";
    }
    authenticate(ascendon, reese, euconsent) {
        this.AscendonToken = ascendon;
        this.reeseCookie = reese;
        this.euCookie = euconsent;
        this.getEntitlementToken();
    }

    playByID(id, window, channelOptions, attempt = 1) {
        if(this.debug) {
            console.log("=======");
            console.log("= Sending net request to " + endpointUrl)
            console.log("= in playById()")
        }
        //var channelOptions = [];
        var endpointUrl = this.buildGetChannelsUrl(id);
        const request = net.request({
            method: 'GET',
            protocol: 'https:',
            hostname: 'f1tv.formula1.com',
            path: endpointUrl,
            redirect: 'follow'
        });
        request.on('response', (response) => {
            response.on('data', (chunk) => {
                try {
                    var res = JSON.parse(chunk);
                } catch {
                    console.log("= Could not parse JSON. Trying again. Attempt " + (attempt+1) + "/5.");
                    console.log(chunk);
                    if (attempt < 5) {
                        this.playByID(id, window, channelOptions, attempt + 1);
                    } else {
                        throw("FATAL ERROR: Could not load url: " + endpointUrl);
                    }
                }
                var url = res.resultObj.url;
                if (response.statusCode === 200) {
                    if(this.debug)
                        console.log("= Status: Success!");

                    var name = res.resultObj.containers[0].metadata.emfAttributes.Global_Title;
                    console.log(name);
                    window.webContents.send("clearStreams", "");
                    /*
                        *  Case Difference: OBC (On-Board-Cam). If true, obcs are available and so are multiple streams.
                        *  If false, only the base contentId view is available. If so, push World Feed to Views.
                        */
                    if (res.resultObj.containers[0].metadata.emfAttributes.OBC) {
                        console.log("OBC");
                        var baseElement = res.resultObj.containers[0].metadata.additionalStreams;
                        for (var i = 0; i < baseElement.length; i++) {
                            var name = "";
                            if (baseElement[i].type === "additional") {
                                name = baseElement[i].reportingName;
                            } else {
                                name = baseElement[i].driverFirstName + " " + baseElement[i].driverLastName;
                            }

                            var chanOpt = {
                                "playUrl": baseElement[i].playbackUrl,
                                "name": name
                            };
                            channelOptions.push(chanOpt);
                            var data = [name, i];
                            window.webContents.send("streamAppend", data);
                        }
                    } else {
                        console.log("No OBC");
                        // Push only one Element to the list
                        var chanOpt = {
                            "playUrl": this.buildEndpointUrl(res.resultObj.containers[0].metadata.contentId, 0),
                            "name": "World Feed"
                        };
                        console.log("Assembled URL: " + this.buildEndpointUrl(res.resultObj.containers[0].metadata.contentId, 0));
                        channelOptions.push(chanOpt);
                        data = ["World Feed", 0];
                        window.webContents.send("streamAppend", data);
                    }
                    return channelOptions;
                }
                if(this.debug)
                console.log("=======\n\n")
            });
        });
        request.on('error', (error) => {
            if(this.debug) {
                console.log('= ERROR: ' + JSON.stringify(error));
                console.log('= ERROR (RAW): ' + error);
                console.log("=======\n\n")
            }
            return channelOptions;
        });
        request.on('close', (error) => {
            //console.log('Last transaction has occured.')
        });
        request.setHeader('User-Agent', 'RaceControl f1viewer');
        //request.setHeader('Accept', '');
        request.setHeader('AscendonToken', this.AscendonToken);
        request.setHeader('EntitlementToken', this.EntitlementToken);
        request.setHeader('Connection', 'keep-alive');
        request.setHeader('Cookie', this.assembleCookie());
        request.end();
    }
    getWidevineLicense(url) {
        const request = net.request({
            method: 'GET',
            protocol: 'https:',
            hostname: 'f1tv.formula1.com',
            path: url,
            redirect: 'follow'
        });
        request.on('response', (response) => {
            //console.log('STATUS: ' + response.statusCode);
            response.on('data', (chunk) => {
                console.log('BODY: ' + chunk);
                if (response.statusCode === 200) {
                    console.log(chunk);
                    return chunk;
                } else {
                    console.log("ERROR: " + chunk);
                }
            });
        });
        request.on('error', (error) => {
            console.log('ERROR: ' + JSON.stringify(error));
        });
        request.on('close', (error) => {
            //console.log('Last transaction has occured.')
        });
        request.setHeader('User-Agent', 'RaceControl f1viewer');
        request.setHeader('apiKey', 'fCUCjWrKPu9ylJwRAv8BpGLEgiAuThx7');
        request.setHeader('AscendonToken', this.AscendonToken);
        request.setHeader('EntitlementToken', this.EntitlementToken);
        request.setHeader('Connection', 'keep-alive');
        request.setHeader('Cookie', this.assembleCookie());
        request.end();
    }
    currentlyLive() {
        if(this.debug) {
            console.log("=======");
            console.log("= Sending net request to " + this.f1tvHomeUrl)
            console.log("= To check for live session");
        }
        const request = net.request({
            method: 'GET',
            protocol: 'https:',
            hostname: 'f1tv.formula1.com',
            path: this.f1tvHomeUrl,
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
                    if (elementToCheck !== "SVOD") {
                        console.log("Live!, ID " + elementId);
                        return elementId;
                    } else {
                        return 0;
                    }
                } else {
                    console.log(res);
                    return 0;
                }
            });
            if(this.debug)
                console.log("= Success\n=======\n\n");
        });
        request.on('error', (error) => {
            console.log('ERROR: ' + JSON.stringify(error));
            return false;
        });
        request.on('close', (error) => {
            //console.log('Last transaction has occured.')
        });
        request.setHeader('User-Agent', 'RaceControl f1viewer');
        request.setHeader('apiKey', 'fCUCjWrKPu9ylJwRAv8BpGLEgiAuThx7');
        request.end();
    }
    getTokenizedUrlAndPlay(finalizedUrl) {
        //console.log("POLLING: " + this.f1tvPlayFirstPart + this.finalizedUrl);
        const request = net.request({
            method: 'GET',
            protocol: 'https:',
            hostname: 'f1tv.formula1.com',
            path: this.f1tvPlayFirstPart + finalizedUrl,
            redirect: 'follow'
        });
        
        request.on('close', (error) => {
            //console.log('Last transaction has occured.')
        });
        request.setHeader('User-Agent', 'RaceControl');
        //request.setHeader('Accept', '');
        request.setHeader('AscendonToken', this.AscendonToken);
        request.setHeader('EntitlementToken', this.EntitlementToken);
        request.setHeader('Connection', 'keep-alive');
        request.setHeader('Cookie', this.assembleCookie());
        request.end();
        return request;
    }
    getEntitlementToken() {
        console.log("Sending entitlement request.....");
        const request = net.request({
            method: 'GET',
            protocol: 'https:',
            hostname: 'f1tv.formula1.com',
            path: '/2.0/R/ENG/WEB_HLS/ALL/USER/ENTITLEMENT',
            redirect: 'follow'
        });
        request.on('response', (response) => {
            response.on('data', (chunk) => {
                var res = JSON.parse(chunk);
                //console.log(res);
                if (response.statusCode === 200) {
                    this.EntitlementToken = res.resultObj.entitlementToken;
                    console.log("SUCCESS!");
                    console.log("LOGGED IN!!")
                    this.window.webContents.send("loginSuccess", "unknown");
                }
        });
        });
        request.on('error', (error) => {
            console.log('ERROR: ' + JSON.stringify(error))
        });
        request.on('close', (error) => {
            console.log('Last transaction has occured.')
        });
        request.setHeader('User-Agent', 'RaceControl f1viewer');
        request.setHeader('Accept', '*');
        request.setHeader('AscendonToken', this.AscendonToken);
        request.setHeader('session-id', 'WEB-15a35481-ea2a-4bd0-8b96-6b8acfbdde39');
        request.setHeader('Connection', 'keep-alive');
        request.setHeader('Cookie', this.assembleCookie());
        request.end();
    }
    assembleCookie() {
        return 'euconsent-v2=' + this.euCookie + "; reese84=" + this.reeseCookie;
    }
    buildGetChannelsUrl(contentIdint) {
        var contentId = String(contentIdint);
        return this.f1tvGetStreamChannelsP1 + contentId + this.f1tvGetStreamChannelsP2 + contentId;
    }
    
    buildEndpointUrl(contentIdint, channelIdint) {
        var contentId = String(contentIdint);
        var channelId = String(channelIdint);
        if (channelId !== "0") {
            return this.f1tvPlayUrl + "channelId=" + channelId + "&contentId=" + contentId;
        } else {
            return this.f1tvPlayUrl + "contentId=" + contentId;
        }
    }
};



module.exports = API;
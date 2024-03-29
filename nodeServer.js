// The link to the magical website that taught us everything we know about node.js:
// READ: https://glitch.com/edit/#!/node-http?path=server.js:2:31
// READ: https://www.sitepoint.com/beginners-guide-node-package-manager/

// Importing web-based protocol module
var http = require("http");
// Importing file system module
var fs = require("fs");
// Importing path module for concatenating paths
var path = require("path");
// Import url module for concatenating url's
var url = require("url");
// Declare our Busboy object for parsing multipart/formdata
var Busboy = require("busboy");
const port = 3000;

// To look up MIME types
// Full list of extensions can be found at
// https://www.iana.org/assignments/media-types/media-types.xhtml
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

// Create the HTTP server with http.createServer([options][, requestListener])
// Documentation: https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener
http.createServer(function(req, res) {

  // Create a new URL object with URL constructor
  // Documentation: https://nodejs.org/docs/latest-v10.x/api/url.html#url_constructor_new_url_input_base
  const parsedUrl = new URL(req.url, "http://127.0.0.1:3000");

  // Get path portion of the URL
  // This is the "/Pages/Upload.html" from "http://127.0.0.1:3000/Pages/Upload.html"
  // Documentation: https://nodejs.org/docs/latest-v10.x/api/url.html#url_url_pathname
  let pathName = parsedUrl.pathname
  pathName = pathName.replace(/%20/g, " ")
  console.log(`Requested Path: ${pathName}`)

  // Returns the extension of the path (.html, .js, .css, etc)
  // Documentation: https://nodejs.org/api/path.html
  let ext = path.extname(pathName)

  // When the player uploads a new game, upload.js sends us a POST request
  if (req.method === "POST") {
    var busboy = new Busboy({
      headers: req.headers
    });
    // Declaring local variables so they can be used in all the busboy event handlers
    var currentFilePath

    // This fires whenever our busboy recieves a field from the posted formData
    busboy.on("field", function(fieldName, val) {
      if (fieldName === "filePath") {
        currentFilePath = val;
      }
    })

    // This fires whenever our busboy recieves a file from the posted formData
    busboy.on("file", function(fieldName, fileStream) {
      if (fieldName === "gameFiles") {

        // Parsing the fileName to figure out if we need to make any more new directories
        // Ex: "key/Libraries/sketch.js"
        var filePathArray = currentFilePath.split("/")
        // Ex: ["key", "Libraries", "sketch.js"]
        // fileName is the last element in filePathArray, the actual name of the file
        fileName = filePathArray.pop()
        var newGamePath = path.join(__dirname, "Games", filePathArray.join('/'))
        // Ex: "Users/Julian/Programs/Play4Change/Games/key/Libraries"
        // If the folders for the path to the file don't exist, make them
        if (!fs.existsSync(newGamePath)) {
          fs.mkdirSync(newGamePath, {
            recursive: true
          })
        }
        var newFilePath = path.join(newGamePath, fileName)
        // Ex: "Users/Julian/Programs/Play4Change/Games/key/Libraries/sketch.js"

        // Create a new file and send the busboy readstream into it
        var writeStream = fs.createWriteStream(newFilePath)
        fileStream.pipe(writeStream)
      }
    })

    // When our busboy finishes receiving the POST...
    busboy.on("finish", function() {
      console.log("POST REQUEST FINISHED")
      res.writeHead(200, {
        'Connection': 'close'
      })
    })
    req.pipe(busboy);
  }

  if (req.method === "GET") {

    // We can handle URLs with trailing '/' by removing the '/'
    // then redirecting the user to that URL using the 'Location' header
    if (pathName !== '/' && pathName[pathName.length - 1] === '/') {
      // If pathName is not to the current directory (aka homepage),
      // and the pathName ends in a '/'...
      res.writeHead(302, {
        //Location header automatically redirects the player
        'Location': pathName.slice(0, -1)
      })
      res.end()
      // Return in order to not run any more code,
      // since the player has just been redirected
      return
    }

    // If the request is for the root directory, return index.html
    // Otherwise, append '.html' to any other request without an extension
    if (pathName === '/') {
      ext = '.html'
      pathName = '/index.html'
    } else if (!ext) {
      ext = '.html'
      pathName += ext
    }

    /*
    Outdated Resource Folder Nonsense
    **/
    // var filePath
    // // If the request is for a game resource, reroute the path to the game file
    // if (fromResources(pathName)) {
    //   // Get the game key from the url parameters from the HTTP headers
    //   var gameKey = req.headers.referer.split("=").pop();
    //
    //   // Get an array of all the file path's components & make them lowercase
    //   var resourcePath = pathName.toLowerCase().split("/");
    //   // Get the index of the "resources" folder, and chop off anything before it
    //   var resourcesIndex = resourcePath.indexOf("resources");
    //   resourcePath = resourcePath.slice(resourcesIndex);
    //
    //   // Make the valid file path to the game's folder
    //   filePath = path.join(__dirname, `Games/${gameKey}/${resourcePath.join("/")}`)
    // } else{
    //   // Construct a valid file path so the requested file can be accessed
    //   // path.join concatenates the current directory (.../play4change)
    //   // and the requested file's pathName
    //   filePath = path.join(__dirname, pathName)
    // }

    // Read and write the file with the appropriate content type
    fs.readFile(__dirname + pathName, function(err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathName);
      }

      res.writeHead(200, {
        'Content-Type': mimeTypes[ext]
      });
      res.end(data);
    })
  }
}).listen(port);
// The server only listens to requests on port 3000 (obviously...)


// //Checks to see if a path contains "resources/"
// function fromResources(pathName) {
//   return (pathName.toLowerCase().search("resources") != -1)
// }

console.log(`Server listening on port: ${port}`)

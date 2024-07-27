const fs = require("node:fs")
const http = require("node:http")
const path = require("node:path")

function initHotReloadPollingClient() {
  setInterval(() => {
    fetch("/__hotreload__")
      .then(response => response.json())
      .then(needsReload => needsReload && location.reload())
      .catch(console.error)
  }, 2000)
}

let fileChanged = false

fs.watch(".", { recursive: true }, (event, file) => {
  if (file && (file.startsWith("demo" + path.sep) || file.startsWith("css" + path.sep))) {
    console.log(event, file)
    fileChanged = true
  }
})

const server = http.createServer()

server.on("request", (request, response) => {
  if (request.url == "/__hotreload__") {
    response.writeHead(200, { "Content-Type": "application/json" })
    response.end(fileChanged.toString())
    fileChanged = false
    return
  }

  console.log(request.method, request.url)

  let file = request.url == "/" ?
    path.join(__dirname, "..", "demo", "index.html") :
    path.join(__dirname, "..", "demo", request.url)

  if (!fs.existsSync(file)) {
    file = path.join(__dirname, "..", request.url)
  }

  const ext = request.url.substring(request.url.lastIndexOf(".") + 1)
  const type =
    ext == "/" ? "text/html" :
    ext == "html" ? "text/html" :
    ext == "css" ? "text/css" :
    ext == "js" ? "text/javascript" :
    ext == "json" ? "application/json" :
    ""

  fs.readFile(file, { encoding: "utf-8" }, (error, data) => {
    if (error) {
      response.writeHead(500, { "Content-Type": "application/json" })
      response.end(JSON.stringify(error))
    } else {
      if (type == "text/html") {
        data = data.replace(/<\/body>/i, "<script>" + initHotReloadPollingClient.toString() + ";" + initHotReloadPollingClient.name + "();</script></body>")
      }

      response.writeHead(200, { "Content-Type": type })
      response.end(data)
    }
  })
})

server.listen(4567, error => {
  if (error) {
    console.error(error)
  } else {
    console.log("Listening on http://localhost:4567/")
  }
})

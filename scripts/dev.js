const fs = require("node:fs")
const http = require("node:http")

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
  if (file) {
    console.log(file, event)
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

  const file = request.url == "/" ? "./index.html" : "." + request.url

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
      if (file == "./index.html" && type == "text/html") {
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

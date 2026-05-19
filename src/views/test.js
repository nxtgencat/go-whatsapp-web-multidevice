import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { join, extname, normalize, dirname } from "path";
import { createReadStream } from "fs";
import { fileURLToPath } from "url";
import net from "net";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIRECTORY = __dirname;
const INITIAL_PORT = 8080;

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm",
};

async function getFreePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      const freePort = server.address().port;
      server.close(() => resolve(freePort));
    });
    server.on("error", () => {
      resolve(getFreePort(port + 1));
    });
  });
}

const server = createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`,
    );
    let pathname = parsedUrl.pathname;

    if (pathname === "/") {
      pathname = "/index.html";
    }

    // Prevent directory traversal
    pathname = normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
    const filePath = join(DIRECTORY, pathname);

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        throw new Error("Not a file");
      }
    } catch (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || "application/octet-stream";

    if (ext === ".html" || ext === ".js") {
      let content = await readFile(filePath, "utf8");

      // Replace Go templates using strings or regex to match the python code logic
      content = content.replace(/\{\{\s*\.AppBasePath\s*\}\}/g, "");
      content = content.replace(/\{\{\s*\.AppVersion\s*\}\}/g, "1.0.0 (Local)");
      content = content.replace(/\{\{\s*\.MaxFileSize\s*\}\}/g, "50000000");
      content = content.replace(/\{\{\s*\.MaxVideoSize\s*\}\}/g, "50000000");
      content = content.replace(
        /\{\{\s*if\s+isEnableBasicAuth\s+\.BasicAuthToken\s*\}\}[\s\S]*?\{\{\s*end\s*\}\}/g,
        "",
      );

      res.writeHead(200, { "Content-Type": mimeType });
      res.end(content);
    } else {
      res.writeHead(200, { "Content-Type": mimeType });
      const readStream = createReadStream(filePath);
      readStream.pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

async function startServer() {
  const port = await getFreePort(INITIAL_PORT);
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();

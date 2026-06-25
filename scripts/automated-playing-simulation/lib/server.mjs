/**
 * Static file server for serving the built dist folder.
 */
import http from 'http'
import fs from 'fs'
import path from 'path'

const contentTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

export function createServer(distDir) {
  return http.createServer((req, res) => {
    const url = req.url === '/' ? '/index.html' : req.url
    const filePath = path.join(distDir, url.split('?')[0])
    const ext = path.extname(filePath).toLowerCase()

    fs.readFile(filePath, (err, data) => {
      if (err) {
        // SPA fallback: serve index.html for unknown routes
        const indexPath = path.join(distDir, 'index.html')
        fs.readFile(indexPath, (indexErr, indexData) => {
          if (indexErr) {
            res.writeHead(404)
            res.end('Not found')
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(indexData)
        })
        return
      }
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' })
      res.end(data)
    })
  })
}

export function startServer(distDir, port) {
  const server = createServer(distDir)
  return new Promise((resolve, reject) => {
    server.listen(port, (err) => {
      if (err) {
        reject(err)
        return
      }
      resolve(server)
    })
  })
}

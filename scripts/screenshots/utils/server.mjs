/**
 * Simple static file server for serving the built dist folder.
 */
import http from 'http'
import fs from 'fs'
import path from 'path'
import { PORT, DIST_DIR } from '../config.mjs'

const contentTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
}

export function createServer(distDir = DIST_DIR) {
  return http.createServer((req, res) => {
    const url = req.url === '/' ? '/index.html' : req.url
    const filePath = path.join(distDir, url.split('?')[0])
    const ext = path.extname(filePath)

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404)
        res.end('Not found')
        return
      }
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' })
      res.end(data)
    })
  })
}

export function startServer(distDir = DIST_DIR, port = PORT) {
  const server = createServer(distDir)
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server))
  })
}

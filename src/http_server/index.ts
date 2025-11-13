import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

import WebSocket, { WebSocketServer } from 'ws';
import { handleMessage } from './utils.ts';

export const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data) => {
    handleMessage(data, ws);
  });
});

export const httpServer = http.createServer(function (req, res) {
  const __dirname = path.resolve(path.dirname(''));
  const file_path =
    __dirname + (req.url === '/' ? '/front/index.html' : '/front' + req.url);
  fs.readFile(file_path, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
  req.on('data', (ch) => console.log(ch));
});

httpServer.on('close', () => wss.close());

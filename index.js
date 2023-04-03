const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const dataHistory = [];
const clients = new Set();

// define a handler for WebSocket connections
wss.on("connection", (ws) => {
  console.log("WebSocket connection established");

  // ws.send(JSON.stringify(getDataHistory()));

  // add new client to the set of connected clients
  clients.add(ws);

  const historyMsg = { type: "history", history: getDataHistory() };
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(historyMsg));
  });

  // send the list of connected clients to all connected clients
  const clientList = Array.from(clients).map((client) => {
    return client._socket.remoteAddress + ":" + client._socket.remotePort;
  });
  const clientListMsg = { type: "clientList", clients: clientList };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(clientListMsg));
    }
  });

  // define a handler for WebSocket messages
  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
    const data = JSON.parse(message);
    dataHistory.push(data);
    // console.log("🚀 ~ file: index.js:21 ~ ws.on ~ dataHistory:", dataHistory)
    // broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

// start the server
server.listen(8080, () => {
  console.log("Server started on port 8080");
});

// function to get data history
function getDataHistory() {
  // return data history here
  return dataHistory;
}

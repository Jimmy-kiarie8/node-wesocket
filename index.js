const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const dataHistory = [];
const clients = new Set();

const uri =
  "mongodb+srv://jimkiarie8:t5nADGdMD9Ky1lZu@logixsaas.2lqn8ko.mongodb.net/?retryWrites=true&w=majority";
const Data = require("./models/data.js");
const router = express.Router();

// define a handler for WebSocket connections
wss.on("connection", (ws) => {
  // console.log("WebSocket connection established");

  // ws.send(JSON.stringify(getDataHistory()));

  // add new client to the set of connected clients
  clients.add(ws);

  const historyMsg = { type: "history", history: getDataHistory() };
  // const historyMsg = { type: "history", history: getLocation() };
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
    // console.log(`Received message: ${message}`);
    const data = JSON.parse(message);
    store(data);
    dataHistory.push(data);
    // broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => {
    // console.log("WebSocket connection closed");
  });
});

// start the server
server.listen(8080, () => {
  // console.log("Server started on port 8080");
});

// function to get data history
function getDataHistory() {
  // return data history here
  return dataHistory;
}

async function connect() {
  try {
    await mongoose.connect(uri);
    console.log(
      "🚀 ~ file: index.js:73 ~ connect ~ Connected:",
      "Connected to mongo db"
    );
  } catch (error) {
    console.log("🚀 ~ file: index.js:74 ~ connect ~ error:", error);
  }
}

connect();

async function store(data) {
  const newData = new Data({
    latitude: data.latitude,
    longitude: data.longitude,
    timestamp: new Date(data.timestamp),
    uid: data.uid,
    name: data.name,
    bearing: data.bearing,
    orderId: data.orderId,
  });

  newData
    .save()
    .then((savedData) => {
      console.log("Data saved:", savedData);
    })
    .catch((err) => {
      console.error("Error saving data:", err);
    });
}

async function getLocation() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000; // Timestamp for 1 hour ago

 return Data.find({
    timestamp: { $gte: oneHourAgo, $lt: Date.now() },
  })
    .then((data) => {
      console.log("Retrieved data:", data);
    })
    .catch((err) => {
      console.error("Error retrieving data:", err);
    });
}

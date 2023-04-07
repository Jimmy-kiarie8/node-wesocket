const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const dataHistory = [];
let locationHistory = null;
const clients = new Set();
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const Data = require("./models/data.js");
connect();
getPositions();
// define a handler for WebSocket connections
wss.on("connection", (ws) => {
  // console.log("WebSocket connection established");

  // ws.send(JSON.stringify(getDataHistory()));

  // add new client to the set of connected clients
  clients.add(ws);

  // const historyMsg = { type: "history", history: getDataHistory() };

  // const historyMsg = { type: "history", history: historyMsg };
  // const historyMsg = { type: "history", history: getPositions() };
  // console.log("🚀 ~ file: index.js:30 ~ wss.on ~ historyMsg:", historyMsg);
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(locationHistory));
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
    // dataHistory.push(data);
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

async function store(data) {
  const newData = new Data({
    latitude: data.latitude,
    longitude: data.longitude,
    timestamp: new Date(data.timestamp),
    uid: data.uid,
    name: data.name,
    phone: data.phone,
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

async function getLocations() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000; // Timestamp for 1 hour ago
  let dataArr = null;
  await Data.find({
    timestamp: { $gte: oneHourAgo, $lt: Date.now() },
  })
    .then((data) => {
      // console.log("🚀 ~ file: index.js:116 ~ .then ~ data:", data)
      dataArr = data;
    })
    .catch((err) => {
      console.error("Error retrieving data:", err);
    });
  // console.log("🚀 ~ file: index.js:125 ~ getLocation ~ dataArr:", dataArr);

  return dataArr;
}

async function getPositions() {
  let data = [];
  await Data.distinct("uid")
  .then(uidValues => {
    const promises = uidValues.map(uid => {
      return Data.findOne({ uid: uid }).sort({ timestamp: -1 });
    });
    return Promise.all(promises);
  })
  .then(docs => {
    data =  docs;
    console.log("Last documents for all uids:", docs);
  })
  .catch(err => {
    console.error("Error retrieving last documents for all uids:", err);
  });
  locationHistory = { type: "history", history: data };
  // return data

}

const express = require("express");
const mqtt = require("mqtt");
const cors = require("cors");

const app = express();
app.use(cors());

let latestData = {};

const mqttClient = mqtt.connect("mqtt://broker.emqx.io");
const topic = "Amrita/Smart/IOT";

mqttClient.on("connect", () => {
  console.log("✅ Connected to MQTT broker");
  mqttClient.subscribe(topic, () => {
    console.log(`📡 Subscribed to topic: ${topic}`);
  });
});

mqttClient.on("message", (topic, message) => {
  try {
    latestData = JSON.parse(message.toString());
    latestData.timestamp = new Date();
    console.log("📥 New data:", latestData);
  } catch (err) {
    console.error("❌ Failed to parse MQTT message", err);
  }
});

app.get("/latest", (req, res) => {
  res.json(latestData);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

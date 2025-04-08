require("dotenv").config(); // Loads environment variables from .env

const express = require("express");
const mqtt = require("mqtt");
const mongoose = require("mongoose");

const app = express();

// MongoDB connection
const mongoURI = process.env.MONGO_URI;

const sensorSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    current_rms: Number,
    ac_voltage_rms: Number,
    vibration_detected: Number,
    vibration_intensity: Number,
    timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model("SensorData", sensorSchema);

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("✅ Connected to MongoDB");

    // Start MQTT *after* MongoDB is ready
    const MQTT_BROKER = "mqtt://broker.emqx.io";
    const MQTT_TOPIC = "sensor/data";
    const client = mqtt.connect(MQTT_BROKER);

    client.on("connect", () => {
        console.log("✅ Connected to MQTT broker");
        client.subscribe(MQTT_TOPIC, (err) => {
            if (!err) {
                console.log(`📡 Subscribed to topic: ${MQTT_TOPIC}`);
            }
        });
    });

    client.on("message", async (topic, message) => {
        if (topic === MQTT_TOPIC) {
            try {
                const data = JSON.parse(message.toString());
                console.log("📥 Data received:", data);

                const entry = new SensorData(data);
                await entry.save();
                console.log("💾 Data saved to MongoDB");
            } catch (err) {
                console.error("❌ Failed to process message:", err);
            }
        }
    });

    // Start Express server
    app.listen(5000, () => {
        console.log("🌐 Backend is live on port 5000");
    });

})
.catch(err => {
    console.error("❌ MongoDB connection error:", err);
});

const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
    res.send("Testenv service running");
});

/* ---------------- SERVICE INFO ---------------- */
app.get("/service-info", (req, res) => {
    try {
        const filePath = path.join(__dirname, "compatibility.json");
        const data = fs.readFileSync(filePath, "utf-8");
        res.setHeader("Content-Type", "application/json");
        res.send(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "compatibility.json missing" });
    }
});

/* ---------------- DEPENDENCY CHECK (very important later) ---------------- */
app.get("/check-dependencies", async (req, res) => {
    try {
        const compatibility = JSON.parse(
            fs.readFileSync(path.join(__dirname, "compatibility.json"))
        );

        const results = {};

        for (const service in compatibility.compatible_with) {
            const url = compatibility.compatible_with[service].url;

            try {
                const response = await axios.get(`${url}/service-info`, { timeout: 3000 });
                results[service] = {
                    status: "reachable",
                    version: response.data.version
                };
            } catch (err) {
                results[service] = {
                    status: "unreachable"
                };
            }
        }

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "dependency check failed" });
    }
});

app.listen(PORT, () => {
    console.log(`Testenv service running on ${PORT}`);
});


const express = require("express");

const app = express();

const PORT = 5050;

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "ARPIARES backend is running"
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

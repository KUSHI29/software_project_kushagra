require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const queryRoutes = require("./routes/queryRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const app = express();
app.use(express.json());

connectDB();
app.use("/api", queryRoutes);
app.use("/api",vendorRoutes);
app.get("/", (req, res) => {
    res.send("Backend is running...");
});

const PORT = process.env.BACKEND_PORT || 3000;
          
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
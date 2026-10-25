const express = require("express");
const router = express.Router();

const { createVendor,searchVendor } = require("../controllers/vendorController");

router.post("/vendors", createVendor);
router.get("/vendors/:vendorName", searchVendor);
module.exports = router;
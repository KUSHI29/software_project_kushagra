const express = require("express");
const router = express.Router();

const { saveQuery } = require("../controllers/queryController");

router.post("/queries", saveQuery);

module.exports = router;
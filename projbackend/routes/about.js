const { aboutUs } = require("../controllers/about");

const express = require("express");
const router = express.Router();

router.get("/about", aboutUs);

module.exports = router;

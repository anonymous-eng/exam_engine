const express = require('express');
const {
  getAllMyResult,
} = require("../controllers/resultControllers");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.route("/myResults").get(protect, getAllMyResult);

module.exports = router;
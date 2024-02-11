const express = require('express');
const {
  createTest,
  startTest,
} = require("../controllers/testControllers");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.route("/").post(protect, createTest);
router.route('/startTest/:id').get(startTest);

module.exports = router;
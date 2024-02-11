const Result = require('../models/resultModel');
const asyncHandler = require("express-async-handler");

const getAllMyResult = asyncHandler(async (req, res) => {
    const results = await Result.find({ createdBy: req.user.id });

    try{
        res.status(200).json(results);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

module.exports = {getAllMyResult};
const Result = require('../models/resultModel');
const Test = require('../models/testModel');
const asyncHandler = require("express-async-handler");

const createTest = asyncHandler(async (req, res) => {
  const testObj = req.body;
  testObj.createdBy = req.user.id;

  const newTest = await Test.create(testObj);
  newTest.active = undefined;

  await Result.create({
    testID: newTest._id,
    createdBy: req.user.id,
  });

  res.status(201).json({
    status: 'success',
    message: 'Test created successfully',
    data:  newTest
  });
});

const startTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  const start = test.startTime;
  const end = test.endTime;

  const startTime = parseInt(start.getTime() / 1000, 10);
  const endTime = parseInt(end.getTime() / 1000, 10);

  const currentTime = parseInt(Date.now() / 1000, 10);

  if (currentTime < startTime || currentTime >= endTime) {
    let message =
      currentTime < startTime ? `Test has not started yet!` : `Test is over!`;

    return res.status(400).json({
      status: 'success',
      message,
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Test started successfully',
    data: test
  });
});

module.exports = {createTest, startTest};
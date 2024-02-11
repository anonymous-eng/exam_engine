const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require("./routes/userRoutes");
const testRoutes = require("./routes/testRoutes");
const resultRoutes = require("./routes/resultRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware.js");
const Test = require('./models/testModel');
const Result = require('./models/resultModel');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());

function removeSpecialEscapeSequences(str) {
  str = str.replaceAll('&lt;', '<');
  return str;
}

const evaluateCode = async (req, res) => {
  try {
    const test = await Test.findById(req.body.testId);
    const func = eval(removeSpecialEscapeSequences(req.body.code));
    const testCase = test.Question.find((ele) => {
      return ele._id.toHexString() === req.body.questionId;
    }).testcases.reduce((t, c) => {
      return [
        ...t,
        c.input.map((a) => {
          if (isNaN(parseFloat(a))) {
            return a;
          } else {
            return parseFloat(a);
          }
        }),
      ];
    }, []);
    const CorrectResults = test.Question.find((ele) => {
      return ele._id.toHexString() === req.body.questionId;
    }).testcases.reduce((t, c) => {
      return [...t, c.output];
    }, []);
    const userResults = CorrectResults.map((e, i) => {
      if (func(testCase[i]) == e) return true;
      return false;
    });
    if (!res) {
      return userResults;
    }
    res.status(200).json({
      message: 'Evaluation Done!',
      data: userResults,
    });
  } catch (err) {
    let errorMessage = '';
    if (err instanceof SyntaxError) {
      errorMessage =
        'Syntax Error: Please check your code syntax and try again.';
    } else if (err instanceof TypeError) {
      errorMessage =
        'Syntax Error: Please check your code syntax and try again.';
    } else if (err.message && err.message.includes('timed out')) {
      errorMessage =
        'Syntax Error: Please check your code syntax and try again.';
    } else {
      errorMessage =
        'Syntax Error: Please check your code syntax and try again.';
    }
    if (res) {
      res.status(500).json({
        message: errorMessage,
      });
    }
  }
};

app.post('/js', async (req, res, next) => {
  await evaluateCode(req, res);
});

app.post(
  '/submit/test', async (req, res) => {
    const candidate = await Result.findOne({
      testID: req.body.testID,
      'candidate.email': req.body.user.email,
    });
    
    if (candidate) {
      res.status(400).json({
        status: 'fail',
        message: 'You have already submitted the test',
      });
      return;
    }
    const result = req.body.code.map(async (code) => {
      return await evaluateCode({
        body: {
          testId: req.body.testID,
          questionId: code.questionID,
          code: code.code,
        },
      });
    });
    
    let evaluatedResult = [];
    await Promise.all(result).then((values) => {
      evaluatedResult = values;
    });
    let userResult = req.body.user;
    const mergedArray = [].concat(...evaluatedResult);

    let correctAns = 0;

    for (const value of mergedArray) {
      if (value === true) {
        correctAns = correctAns + 1;
      }
    }

    let score = (correctAns / mergedArray.length) * 100;
    userResult.score = score;
    const newResult = await Result.updateOne(
      { testID: req.body.testID },
      { $push: { candidate: userResult } }
    );
    res.status(200).json({
      status: 'success',
      message: 'Your Test Submitted Successfully',
      data: {
        newResult,
      },
    });
  }
);

app.use('/users', userRoutes);
app.use('/tests', testRoutes);
app.use('/results', resultRoutes);

// --------------------------deployment------------------------------
const __dirname2 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname2, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname2, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}
// --------------------------deployment------------------------------

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}..`
  )
);
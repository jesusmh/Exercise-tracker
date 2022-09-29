const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");
const bodyParser = require("body-parser")


mongoose.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const Log = mongoose.model(
  "Log",
  new mongoose.Schema({
    userid: String,
    username: String,
    description: String,
    duration: Number,
    date: { type: Date, default: Date.now },
  })
);

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: String,
  })
);

app.post("/api/users", async (req, res) => {
  let newUser = new User({
    username: req.body.username,
  });
  try {
    await newUser.save();
    res.json({ username: newUser.username, _id: newUser._id });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    let allUsers = await User.find({});
    res.json(allUsers);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.post("/api/users/:id/exercises", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.end("not found");
    }

    const log = new Log({
      userid: req.params.id,
      username: user.username,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: req.body.date
        ? new Date(req.body.date).toDateString()
        : new Date().toDateString(),
    });

    await log.save();

    res.json({
      username: log.username,
      description: log.description,
      duration: log.duration,
      date: new Date(log.date).toDateString(),
      _id: req.params.id,
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get("/api/users/:id/logs", async (req, res) => {
  const user = await User.findById(req.params.id);
  const limit = Number(req.query.limit) || 0;
  const from = req.query.from || new Date(0);
  const to = req.query.to || new Date(Date.now())

    console.log("with query");
    const log = await Log.find({
      userid: req.params.id,
      date: { $gte: from , $lte: to }
    })
    .select("-_id -userid -__v")
    .limit(limit)
    
    console.log(log)
    let userLog = log.map((each) => {
      return {
        description: each.description,
        duration: each.duration,
        date: new Date(each.date).toDateString(),
      };
    });

    res.json({
      _id: req.params.id,
      username: user.username,
      count: log.length,
      log: userLog,
    });
  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
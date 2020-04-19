const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const {
  ADD_NEW_TASK,
  TASK_GET_ALL,
  TASK_UPDATE,
  TASK_COLOR_SET,
  TASK_REMOVE,
  TASK_SORT,
  LOGIN,
  USER_LOGGED,
} = require("./endpoints");
require("dotenv").config();
const SERVER_IP = process.env.SERVER_IP;
const PORT = process.env.NODE_PORT || 8080;

try {
  mongoose.connect("mongodb://localhost/taskmanager", {
    useNewUrlParser: true,
  });
  let db = mongoose.connection;

  //Check connection
  db.once("open", () => {
    console.log("Connected to MongoDb!");
  });

  db.on("error", (err) => {
    console.log("err", err);
  });
} catch (e) {
  console.log("failed connecting to mongoDB", e);
}

const app = express();
console.log("SERVER_IP", SERVER_IP);

var cors = require("cors");
// app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cors({ credentials: true, origin: SERVER_IP }));

//bring in Models
let User = require("./models/user.js");
let Task = require("./models/task.js");

app.use("/public", express.static(path.join(__dirname + "/public")));
//same as saying:
// var publicDir = require("path").join(__dirname, "/public");
// app.use(express.static(publicDir));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  console.log("Hello World");
  res.send("Hello World");
});
app.get("/back", (req, res) => {
  console.log("Hello World back");

  res.send("Hello World BACK");
});

app.post(USER_LOGGED, (req, res) => {
  console.log("req.body.auth USER_LOGGED", req.body.auth, typeof req.body.auth);
  if (!req.body.auth || req.body.auth === "undefined") {
    res
      .status(401) // HTTP status 404: Unauthorized
      .send("Not logged in ");
  } else {
    User.find({ auth: req.body.auth }, (err, answer) => {
      if (err) {
        console.log("login database lookup error");
      } else {
        console.log("answer ul", answer[0], typeof answer);
        if (Array.isArray(answer) && answer[0]) {
          //authorized
          res.status(200).send({ logged: true });
        } else {
          //unauthorized
          res
            .status(401) // HTTP status 404: Unauthorized
            .send("Not logged in ");
        }
      }
    });
  }
});

app.post(LOGIN, (req, res) => {
  // console.log("login req", req);
  const login = req.body;
  // console.log("login", login, typeof login);
  User.find(
    { username: login.username, password: login.password },
    (err, answer) => {
      if (err) {
        console.log("login database lookup error");
      } else {
        console.log("answer:", answer[0], typeof answer);
        if (answer[0]) {
          //authorized
          const millis = Date.now();
          const seconds = Math.floor(millis / 1000);
          const random = Math.random();
          const userToken = Math.floor(seconds * random);
          User.updateOne(
            { username: login.username },
            { auth: userToken },
            (err, res) => {
              if (err) {
                console.log("err", err);
              } else {
                console.log("res", res);
              }
            }
          );

          res.json({ success: true, userToken });
        } else {
          console.log("login failed");
          //unauthorized
          res
            .status(401) // HTTP status 404: NotFound
            .send("Login Failed");
        }
      }
    }
  );
});

app.post("/signup", (req, res) => {
  // console.log("login req", req);
  const signup = req.body;
  console.log("signup", signup, typeof signup);
  try {
    User.find({ username: signup.username }, (err, answer) => {
      if (err) {
        console.log("signup > username find > database lookup error");
      } else {
        console.log("answer:", answer, answer[0], typeof answer);
        if (!Array.isArray(answer)) {
          console.log("signup failed");
          //unauthorized
          res
            .status(401) // HTTP status 404: NotFound
            .send("Signup Failed (users DB corrupted)");
        } else if (answer[0]) {
          // already exists
          console.log("user", signup.username, "already exists");
          res.status(303).send("USERNAME_ALREADY_EXISTS");
        } else {
          //can create
          const millis = Date.now();
          const seconds = Math.floor(millis / 1000);
          const random = Math.random();
          const userToken = Math.floor(seconds * random);
          User.create(
            {
              username: signup.username,
              email: signup.email,
              password: signup.password,
              fromLanguage: "en",
              toLanguage: "fr",
              auth: userToken,
            },
            (err, resp) => {
              if (err) {
                console.log("err", err);
                res
                  .status(401) // HTTP status 404: NotFound
                  .send("Signup Failed");
              } else {
                console.log("res", res);
                //res.json({ success: true, userToken });
                res.status(200).send({ success: true, userToken: userToken });
              }
            }
          );
        }
      }
    });
  } catch (e) {
    console.log("user find caught", e);
  }
  console.log("user find end");
});

app.post("/logout", (req, res) => {
  console.log("logout req.body.auth", req.body.auth);
  User.find({ auth: req.body.auth }, (err, answer) => {
    if (err) {
      console.log("logout database lookup error");
    } else {
      console.log("logout answer ul", answer[0], typeof answer);
      if (answer[0]) {
        //authorized
        User.updateOne({ auth: req.body.auth }, { auth: 0 }, (err, res) => {
          if (err) {
            console.log("err", err);
          } else {
            console.log("res", res);
          }
        });
        res.status(200).send({ loggedOut: true });
      } else {
        //unauthorized
        res
          .status(401) // HTTP status 404: Unauthorized
          .send("Not logged out ");
      }
    }
  });
});

app.post(TASK_COLOR_SET, async (req, res) => {
  const _id = req.body._id;
  const color = req.body.color;

  Task.updateOne(
    {
      _id: _id,
    },
    {
      color,
    },
    (err, result) => {
      if (err) {
        console.log("err", err);
      } else {
        console.log("result", result);
        res.send(result);
      }
    }
  );
});

app.post(TASK_UPDATE, async (req, res) => {
  const _id = req.body._id;
  const username = req.body.username;
  const caption = req.body.caption;
  const text = req.body.text;

  Task.updateOne(
    {
      _id: _id,
    },
    {
      caption,
      text,
    },
    (err, result) => {
      if (err) {
        console.log("err", err);
      } else {
        console.log("result", result);
        res.send(result);
      }
    }
  );
});

app.post(ADD_NEW_TASK, async (req, res) => {
  const username = req.body.username;
  const caption = req.body.caption ? req.body.caption : "";
  const text = req.body.text ? req.body.text : "";
  const color = req.body.color;

  console.log("caption, text", caption, text);
  Task.create(
    {
      username: username,
      caption: caption,
      text: text,
      color,
    },
    (err, result) => {
      if (err) {
        console.log("err", err);
      } else {
        console.log("result", result);
        res.send(result);
      }
    }
  );
});

app.post(TASK_REMOVE, async (req, res) => {
  const _id = req.body._id;

  Task.deleteOne(
    {
      _id: _id,
    },
    (err, result) => {
      if (err) {
        console.log("err", err);
      } else {
        console.log("result", result);
        res.send(result);
      }
    }
  );
});

app.post(TASK_SORT, (req, res, next) => {
  console.log("TASK_SORT");

  username = req.body.username;
  order = req.body.order;
  let error = false;

  order.forEach((o, index) => {
    Task.updateOne(
      {
        username,
        _id: o,
      },
      { index: index },
      (err, suc) => {
        if (err) {
          error = true;
          res.status(500).send("task sort error");
        } else {
        }
      }
    );
  });

  res.send("tasks sorted");
});

app.post(TASK_GET_ALL, async (req, res) => {
  const username = req.body.username;

  Task.find(
    {
      //   username: username,
    },
    (err, result) => {
      if (err) {
        console.log("err", err);
      } else {
        console.log("result", result);
        res.send(result);
      }
    }
  );
});

app.post("/userSettings/set", (req, res) => {
  console.log("userSettings", req.body.type, req.body.setting, req.body.auth);

  if (req.body.type === "toLanguage") {
    User.updateOne(
      { auth: req.body.auth },
      { toLanguage: req.body.setting },
      (err, suc) => {
        if (err) {
          console.log("err", err);
          res.send("userSettings_FAIL_AUTH_FIND");
        } else {
          console.log("userSettings_TO_SUCCESS");
          //res.send("userSettings_TO_SUCCESS");
        }
      }
    );
  }

  if (req.body.type === "choicesCount") {
    User.updateOne(
      { auth: req.body.auth },
      { choicesCount: req.body.setting },
      (err, suc) => {
        if (err) {
          console.log("err", err);
          res.send("LANGUAGE_TO_FAIL_AUTH_FIND");
        } else {
          console.log("LANGUAGE_TO_SUCCESS");
          //res.send("LANGUAGE_TO_SUCCESS");
        }
      }
    );
  }

  res.status(200).send("updated");
});

app.post("/userSettings/get", (req, res) => {
  console.log("get userSettings", req.body.auth);
  User.findOne({ auth: req.body.auth }, (err, suc) => {
    if (err) {
      console.log("err", err);
      res.send("LANGUAGE_TO_FAIL_AUTH_FIND");
    } else {
      console.log("LANGUAGE_TO_SUCCESS", suc);

      const typeArr = JSON.parse(req.body.type);

      let response = {
        message: "LANGUAGE_TO_SUCCESS",
      };

      if (typeArr.includes("username")) {
        response.username = suc.username;
      }

      if (typeArr.includes("choicesCount")) {
        response.choicesCount = suc.choicesCount;
      }

      if (typeArr.includes("toLanguage")) {
        response.toLanguage = suc.toLanguage;
      }

      if (typeArr.includes("fromLanguage")) {
        response.fromLanguage = suc.fromLanguage;
      }

      if (typeArr.includes("flaggedWords")) {
        response.flaggedWords = suc.flaggedWords;
      }

      if (typeArr.includes("positions")) {
        const helpx = suc.positions
          ? suc.positions.find((p) => {
              return (
                p.toLanguage === suc.toLanguage &&
                p.fromLanguage === suc.fromLanguage
              );
            })
          : undefined;
        console.log("helpx", helpx);
        if (helpx && helpx.position) {
          response.position = helpx.position;
        } else {
          response.position = 0;
        }
      }

      if (typeArr.includes("moveSpeed")) {
        const helpy = suc.moveSpeed.find((p) => {
          return (
            p.toLanguage === suc.toLanguage &&
            p.fromLanguage === suc.fromLanguage
          );
        });
        if (helpy && helpy.moveSpeed) {
          response.moveSpeed = helpy.moveSpeed;
        } else {
          response.moveSpeed = 0;
        }
      }

      console.log("response", response);
      res.status(200).send(response);
    }
  });
});

const api = require("./routes/user.routes");

app.use("/api", api);

app.use((req, res, next) => {
  // Error goes via `next()` method
  setImmediate(() => {
    next(new Error("Something went wrong"));
  });
});

app.use(function (err, req, res, next) {
  console.error("app use er", err.message);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).send(err.message);
});

//// FILE UPLOAD END ////

const port = process.env.PORT || PORT;
const server = app.listen(port, () => {
  console.log("Connected to port " + port);
});

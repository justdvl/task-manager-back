const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const {
  PAIR_EDIT,
  TRANSLATE_ONE,
  LOG_USER_ACTION,
  USER_PROGRESS_GET_TWENTY_FOUR,
  USER_WORD_FLAG,
  DICT_GET_TOTALWORDS,
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
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const SERVER_IP = process.env.SERVER_IP;

// let DICT_SIZE = 999;
let MOVE_SPEED = 250;
const UP = 1;
const DOWN = 3;
const SPREAD = 40;

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

// mongoose.collections((err, result) => {
//   if (err) {
//     console.log("err", err);
//   } else {
//     console.log("result", result);
//   }
// });

//Check for db errors

const app = express();
console.log("SERVER_IP", SERVER_IP);

var cors = require("cors");
// app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
// app.use(cors({ credentials: true, origin: "http://64.225.110.242" }));
app.use(cors({ credentials: true, origin: SERVER_IP }));

//bring in Models
let Language = require("./models/language.js");
let User = require("./models/user.js");
let Frequent = require("./models/frequent.js");
let Pair = require("./models/pair.js");
let Log = require("./models/log.js");
let Translation = require("./models/translation.js");
let Dict = require("./models/dict.js");
let Task = require("./models/task.js");

function parseHrtimeToSeconds(hrtime) {
  var seconds = (hrtime[0] + hrtime[1] / 1e9).toFixed(3);
  return seconds;
}

let current = "";

// app.listen(80, function () {
//   console.log('CORS-enabled web server listening on port 80')
// })

// app.options("*", cors()); // include before other routes
app.use("/public", express.static(path.join(__dirname + "/public")));
// app.use("/public", express.static(path.join(__dirname, "static")));

// app.use(cors({ credentials: true, origin: "http://158.195.108.7" }));

// app.use(function (req, res, next) {
//   var allowedOrigins = [
//     "http://127.0.0.1:3000",
//     "http://localhost:3000",
//     "http://158.195.108.7",
//   ];
//   var origin = req.headers.origin;
//   console.log("origin", origin);
//   if (allowedOrigins.indexOf(origin) > -1) {
//     res.header("Access-Control-Allow-Origin", origin);
//   }
//   //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8020');
//   // res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
//   // res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   res.header("Access-Control-Allow-Credentials", true);
//   return next();
// });

// app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

// app.use(cors());

// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

//Body parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.get("/", (req, res) => {
  console.log("Hello World");
  res.send("Hello World");
  // res.sendFile(path.join(__dirname, "static", "index.html"));
});
app.get("/back", (req, res) => {
  console.log("Hello World back");

  res.send("Hello World BACK");
  // res.sendFile(path.join(__dirname, "static", "index.html"));
});

app.get("/double", (req, res) => {
  console.log("Hello World double");

  res.send("Hello World double");
  // res.sendFile(path.join(__dirname, "static", "index.html"));
});

app.get("/back/two", (req, res) => {
  console.log("Hello World back two");

  res.send("Hello World two");
  // res.sendFile(path.join(__dirname, "static", "index.html"));
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
          current = login.username;
          console.log("current user:", current);
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
          current = signup.username;
          console.log("current user:", current);
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

// app.get("/logout", (req, res) => {
//   current = "";
//   console.log("logout");
//   res.json({ success: true });
// });

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

readFile = (name, code) => {
  fs.readFile("list.txt", "utf8", (err, file) => {
    if (err) {
      console.log("err", err);
    } else {
      previousText = file;
      console.log("previous text", previousText);
      let object = {};
      if (previousText) {
        object = JSON.parse(previousText);
      }
      object[name] = code;
      console.log("object", object);
      console.log("red file to variable.");

      fs.writeFile("list.txt", JSON.stringify(object), (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("file saved");
        }
      });
    }
  });
};

const getToFrom = async (username) => {
  console.time("getToFrom", username);

  return User.findOne({ username: username }, (err, suc) => {
    if (err) {
      console.log("err", err);
      //   return { toLanguage: toLanguage, fromLanguage: fromLanguage };
      return false;
    } else {
      console.log("LANGUAGE_getToFrom_SUCCESS", suc);
      console.timeEnd("getToFrom");
      return { toLanguage: suc.toLanguage, fromLanguage: suc.fromLanguage };
    }
  });
};

const getMoveSpeed = async (username) => {
  console.time("getMoveSpeed", username);

  return await User.findOne({ username: username }, (err, suc) => {
    if (err) {
      console.log("err", err);
      return false;
    } else {
      return { moveSpeed: suc.moveSpeed };
    }
  });
};

const setMoveSpeed = async (username, fromLanguage, toLanguage, moveSpeed) => {
  return User.updateOne(
    { username: username },
    {
      moveSpeed: {
        moveSpeed: moveSpeed,
        fromLanguage: fromLanguage,
        toLanguage: toLanguage,
      },
    },
    (err, suc) => {
      if (err) {
        console.log("err", err);
        return false;
      } else {
        return true;
      }
    }
  );
};

const dictGetTotalWords = async (fromLanguage, toLanguage) => {
  const found = await Dict.findOne(
    { fromLanguage: fromLanguage, toLanguage: toLanguage },
    (err, suc) => {
      if (err) {
        console.log("err", err);
        // return false;
      } else {
        console.log("dictGetTotalWords SUCCESS", suc);
        // return suc.totalWords;
      }
    }
  );

  console.log("found>>", found);
  console.log("found.tota", found.totalWords);
  return found;
};

app.post(DICT_GET_TOTALWORDS, async (req, res) => {
  const fromLanguage = req.body.fromLanguage;
  const toLanguage = req.body.toLanguage;

  Dict.findOne(
    { fromLanguage: fromLanguage, toLanguage: toLanguage },
    (err, suc) => {
      if (err) {
        console.log("err", err);
        res.status(500).send("DICT_GET_TOTALWORDS FAIL");
      } else {
        console.log("LANGUAGE_getToFrom_SUCCESS", suc);
        res.send({ totalWords: suc.totalWords });
      }
    }
  );
});

app.post("/get", async (req, res) => {
  console.time("get");
  var startTime = process.hrtime();

  console.log("get id > I got file");

  console.log("req.params.count", req.body.count);
  let count =
    req.body.count === "undefined"
      ? 4
      : req.body.count
      ? parseInt(req.body.count)
      : 4;

  //   let localRes = null;
  //   const promise = new Promise(resolve => {
  //     localRes = resolve;
  //   });

  const username = req.body.username;
  //const toFrom = await getToFrom(username); //here could be some optimalization, to receive toFrom from React if it has it
  const userFound = await User.findOne(
    { username: username },
    (userErr, userFound) => {
      if (userErr) {
        console.log("user find err", userErr);
        res.status(500).send("USER FIND FAIL");
      } else {
        return userFound;
      }
    }
  );
  let toLanguage = "fr";
  let fromLanguage = "en";
  let position = 50;
  console.log("userFound", userFound);
  if (userFound) {
    toLanguage = userFound.toLanguage ? userFound.toLanguage : "fr";
    fromLanguage = userFound.fromLanguage ? userFound.fromLanguage : "en";
    if (userFound.positions) {
      specificLanguagePosition = userFound.positions.find((p) => {
        return p.toLanguage === toLanguage && p.fromLanguage === fromLanguage;
      });
      if (specificLanguagePosition) {
        position = specificLanguagePosition.position;
      } else {
      }
    } else {
    }
  }
  console.log("toLanguage", toLanguage);
  console.log("position", position);

  const dict = await dictGetTotalWords(fromLanguage, toLanguage);
  DICT_SIZE = dict.totalWords;

  console.log("Start, DICT_SIZE:", DICT_SIZE);
  position = Math.min(position, DICT_SIZE - SPREAD);

  let randomsArr = [];
  let index = 0;

  const flaggedIds = [];
  if (userFound.flaggedWords && userFound.flaggedWords.length > 0) {
    userFound.flaggedWords.forEach((f) => {
      if (f.language === fromLanguage) {
        flaggedIds.push(f.id);
      }
    });
  }

  console.log("flaggedIds", flaggedIds);
  console.log(" SPREAD, DICT_SIZE, position ", SPREAD, DICT_SIZE, position);

  while (randomsArr.length < count) {
    cycleLimiter = 0;
    let randomCandidate = -1;
    while (
      randomCandidate === -1 ||
      (cycleLimiter < 50 &&
        (randomsArr.includes(randomCandidate.toString(10)) ||
          flaggedIds.includes(randomCandidate)))
    ) {
      if (cycleLimiter >= 49) {
        console.log("CYCLE LIMITED", cycleLimiter);
        position--;
      }
      cycleLimiter += 1;
      randomCandidate = Math.min(
        Math.max(0, position + Math.floor(Math.random() * SPREAD) - SPREAD / 2),
        DICT_SIZE
      );
    }
    console.log("randomCandidate", randomCandidate);
    if (!randomsArr.includes(randomCandidate.toString(10))) {
      randomsArr.push(randomCandidate.toString(10));
    }
    console.log("logic", randomsArr.includes(randomCandidate.toString(10)));
    console.log("randomsArr", randomsArr);
    console.log("randomCandidate.toString(10)", randomCandidate.toString(10));
  }

  console.log("randomsArr", randomsArr);

  //todo need to get more words

  // getting count of word pairs for lesson request
  await Pair.find({
    toLanguage: toLanguage,
    fromLanguage: fromLanguage,
    // display: true
    //translation: { $ne: "" },
    //word: { $ne: "" }
  })
    .where("id")
    .in(randomsArr)
    .exec(async (err, found) => {
      if (err) {
        console.log("foundMore err");
        res.status(500).send("PAIR_FIND_ERR");
      } else {
        console.log("found", found);
        // response.push({
        //   id: found.id,
        //   word: found.word,
        //   translation: found.translation
        // });
        // localRes();

        const words = found.map((f) => f.word);

        wordsStats = await getWordsStats(
          words,
          fromLanguage,
          toLanguage,
          username
        );

        console.log("wordsStats", wordsStats);

        const response = found.map((r) => {
          let goodBad = [];
          wordsStats.forEach((w) => {
            if (r.word === w.word) {
              if (w.success) {
                console.log("good!");
                goodBad.push(1);
              } else {
                console.log("bad!");
                goodBad.push(0);
              }
            }
          });
          return {
            id: r.id,
            fromLanguage: r.fromLanguage,
            toLanguage: r.toLanguage,
            word: r.word,
            translation: r.translation,
            display: r.display,
            goodBad: goodBad,
          };
        });

        console.log("found enahnced", response);

        let noData = false;
        if (response && Array.isArray(response) && response.length === 0) {
          noData = true;
        }
        console.log("End");

        // console.log("sendd response", response);
        console.timeEnd("get");

        var elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
        console.log("It takes " + elapsedSeconds + "seconds");

        res.status(200).send({
          pairs: response,
          noData: noData,
          lookupTime: elapsedSeconds,
          position: position,
        });
      }
    });
});

getWordsStats = async (words, fromLanguage, toLanguage, username) => {
  return await Log.find({
    toLanguage: toLanguage,
    fromLanguage: fromLanguage,
    username: username,
  })
    .where("word")
    .in(words);
};

//ass submit POST route
app.post("/languages/add", (req, res) => {
  console.log(
    "languages/add word:",
    req.body.word,
    "translation",
    req.body.translation
  );
  let language = new Language();
  //   language.word = req.body.word;
  //   language.translation = req.body.translation;

  console.log("language:", language);

  //find if it exists already
  Language.find({ word: req.body.word }, (err, languages) => {
    console.log("finding", req.body.word);
    if (err) {
      console.log("err", err);
    } else {
      console.log("found", languages, "len:", languages.length);
      if (languages.length) {
        console.log("already exists");
        res.send("ALREADY_EXISTS");
      } else {
        console.log("doesnt exist yet, i'll try to add");
        try {
          Language.create(
            {
              word: req.body.word,
              translation: req.body.translation,
            } /*,
            (err, obj) => {
              if (err) {
                console.log("err", err);
              } else {
                console.log("obj", obj);
              }
            }*/
          );
          console.log("add should be success");
          res.send("ADDED");
        } catch (e) {
          console.log("e", e);
          res.send("NOT_ADDED");
        }
      }
    }
  });

  console.log("end find");
});

app.post("/languages/get-all", (req, res) => {
  Language.find({}, (err, languages) => {
    if (err) {
      console.log("err", err);
    } else {
      console.log("languages", languages);
      res.send(languages);
    }
  });
});

app.post("/frequencies/get-all", (req, res) => {
  Frequent.find({}, (err, frequencies) => {
    if (err) {
      console.log("err", err);
    } else {
      console.log("frequencies", frequencies);
      res.send(frequencies);
    }
  });
});

app.post("/pairs/get-all", async (req, res) => {
  const username = req.body.username;
  const { toLanguage, fromLanguage } = await getToFrom(username); //here could be some optimalization, to receive toFrom from React if it has it
  console.log("toLanguage", toLanguage);

  Pair.find(
    { toLanguage: toLanguage, fromLanguage: fromLanguage },
    null,
    { sort: { id: 1 } },
    (err, pairs) => {
      if (err) {
        console.log("err", err);
      } else {
        console.log("pairs", pairs);
        res.send(pairs);
      }
    }
  );
});

app.post("/pair/flagDuos", async (req, res) => {
  const toLanguage = req.body.toLanguage;
  const fromLanguage = req.body.fromLanguage;
  const username = req.body.username;
  console.log("flagDuos, toLanguage", toLanguage);

  Pair.find(
    { toLanguage: toLanguage, fromLanguage: fromLanguage },
    null,
    { sort: { id: 1 } },
    (err, pairs) => {
      if (err) {
        console.log("err", err);
        res.status(500).send("PAIR FIND FAIL");
      } else {
        console.log("pairs", pairs);
        const dualIds = [];
        const noDuplicates = [];
        pairs.forEach((p) => {
          if (p.word === p.translation) {
            console.log("word", p);
            dualIds.push(p.id);
          } else {
            noDuplicates.push(p);
          }
        });
        console.log("dual IDS", dualIds);
        console.log("username", username);
        // User.updateOne(
        //   { username: username },
        //   { duos: dualIds },
        //   (err, dbres) => {
        //     if (err) {
        //       console.log("err", err);
        //       res.status(500).send("USER UPDATE FAIL");
        //     } else {
        //       console.log("dbres", dbres);
        //       res.status(200).send("USER UPDATE SUCCESS");
        //     }
        //   }
        // );
      }
    }
  );
});

app.post("/pair/delete", async (req, res) => {
  const toLanguage = req.body.toLanguage;
  const fromLanguage = req.body.fromLanguage;
  console.log("delete, toLanguage", toLanguage);

  let success = true;

  Pair.deleteMany(
    { toLanguage: toLanguage, fromLanguage: fromLanguage },
    (err, pairs) => {
      if (err) {
        console.log("err", err);
        success = false;
        //res.status(500).send("PAIR DELETE FAIL");
      } else {
        // res.status(200).send("PAIR DELETE OK");
      }
    }
  );

  Dict.deleteOne(
    {
      fromLanguage: fromLanguage,
      toLanguage: toLanguage,
    },
    (err, pairs) => {
      if (err) {
        console.log("err", err);
        success = false;
      } else {
        console.log("deleted from dict");
      }
    }
  );

  if (success) {
    res.status(200).send("PAIR DELETE OK");
  } else {
    res.status(500).send("PAIR DELETE FAIL");
  }
});

const translateThisWord = async (id, word, fromLanguage, toLanguage) => {
  //   console.log("translate", word);

  if (fromLanguage === undefined || toLanguage === undefined) {
    console.error("to or from language underined in translateThisWord");
    return;
  }
  let y = null;
  const response = await Pair.find(
    { word: word, toLanguage: toLanguage, fromLanguage: fromLanguage },
    async (err, response) => {
      if (err) {
        console.log("err find pair", err);
      } else {
        console.log("pair find response", response);
      }
    }
  );

  console.log("x", response);

  // console.log("find pair response", response);
  if (Array.isArray(response) && response.length > 1) {
    console.log("duplicities in pair translated");
    Pair.deleteOne(
      { word: word, toLanguage: toLanguage, fromLanguage: fromLanguage },
      (err, responseD) => {
        if (err) {
          console.log("error deleting one pair");
        } else {
          console.log("deleted one duplicit pair");
        }
      }
    );
    return false;
  } else if (Array.isArray(response) && response.length === 1) {
    //   console.log("exactly one translation already, I keep it");
    return false;
  } else {
    //do actual translation
    console.log("going to await cached");
    const translationA = await cachedTranslation(
      word,
      fromLanguage,
      toLanguage
    );
    console.log("awaited cached");
    const translation = translationA[0];
    // console.log("Pair.create", word, translation);
    if (word.toLowerCase() !== translation.toLowerCase()) {
      console.log("translation", translation);
      y = translation;
      return translation;
    } else {
      console.log("- SKIPPING --");
      return false;
    }
  }

  console.log("x", y);
  return y;
};
// //
// app.post(PAIR_FLAG, (req, res) => {
//   const fromLanguage = req.body.fromLanguage;
//   const toLanguage = req.body.toLanguage;
//   const word = req.body.word;
//   const username = req.body.username;
// });

const cachedTranslation = async (word, fromLanguage, toLanguage) => {
  console.log("cachedTranslation");
  const answer = await Translation.find({
    word: word,
    fromLanguage: fromLanguage,
    toLanguage: toLanguage,
  }).exec();
  console.log("answer", answer);
  // async (err, answer) => {
  //   if (err) {
  //     console.log("cached Trans error");
  //   } else if (!Array.isArray(answer)) {
  //     console.log("cached trans resp not array");
  //   } else {
  //     if (answer.length === 0) {
  //       return "need";
  //     }
  //   }
  // })
  //   console.log("awaited", answer);
  if (answer.length === 0) {
    const translations = await realTranslation(word, fromLanguage, toLanguage);
    console.log("got real trans", translations.translations[0].translatedText);
    saveTranslation(
      word,
      [translations.translations[0].translatedText],
      fromLanguage,
      toLanguage
    );
    return [translations.translations[0].translatedText];
  } else {
    const cache = await Translation.findOne({
      word: word,
      fromLanguage: fromLanguage,
      toLanguage: toLanguage,
    }).exec();

    console.log("cache", cache);
    return cache.translations;
  }
  //   {
  //     console.log("no trans yet");
  //     const translation = await realTranslation(
  //       word,
  //       fromLanguage,
  //       toLanguage
  //     );
  //     console.log("got real trans", translation);
  //     return translation;
  //   }
};

const saveTranslation = (word, translations, fromLanguage, toLanguage) => {
  Translation.create(
    {
      word: word,
      translations: translations,
      fromLanguage: fromLanguage,
      toLanguage: toLanguage,
    },
    (err, res) => {
      if (err) {
        console.log("err", err);
      } else {
        console.log("res", res);
      }
    }
  );
};

const realTranslation = async (word, fromLanguage, toLanguage) => {
  let url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;
  url += "&q=" + encodeURI(word);
  url += `&source=${fromLanguage}`;
  url += `&target=${toLanguage}`;

  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((response) => {
        console.log("response from google: ", response);
        console.log("return", response.data.translations[0].translatedText);

        return response.data;
      })
      .catch((error) => {
        console.log("There was an error with the translation request: ", error);
        return false;
      });
  } catch (e) {
    console.log("translateion e", e);
  }
};

app.post(TRANSLATE_ONE, async (req, res) => {
  const fromLanguage = req.body.fromLanguage;
  const toLanguage = req.body.toLanguage;
  const word = req.body.word;

  translation = await cachedTranslation(word, fromLanguage, toLanguage);

  console.log("cached", translation);
  //   try {
  //     fetch(url, {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Accept: "application/json"
  //       }
  //     })
  //       .then(res => res.json())
  //       .then(response => {
  //         console.log("response from google: ", response);
  //         console.log("return", response.data.translations[0].translatedText);
  //         res.send(response);
  //         // const translation = response.data.translations[0].translatedText;
  if (translation) {
    // Pair.create({
    //   id: id,
    //   word: word,
    //   toLanguage: toLanguage,
    //   fromLanguage: fromLanguage,
    //   translation: translation
    // });
    res.send(translation);
  } else {
    console.log("There was an error with the translation request: ");
    res.status(500).send("TRANSLATE ONE FAIL");
  }
  //       })
  //       .catch(error => {
  //         res.status(500).send("TRANSLATE ONE FAIL");
  //       });
  //   } catch (e) {
  //     console.log("translateion e", e);
  //   }
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

app.post(PAIR_EDIT, (req, res) => {
  const fromLanguage = req.body.fromLanguage;
  const toLanguage = req.body.toLanguage;
  const id = req.body.id;
  const translation = req.body.translation;

  console.log("pair edit", id, fromLanguage, toLanguage, translation);
  Pair.updateOne(
    { id: id, fromLanguage: fromLanguage, toLanguage: toLanguage },
    { translation: translation },
    (err, result) => {
      if (err) {
        console.log("err", err);
        res.status(500).send("PAIR_EDIT FAILED");
      } else {
        console.log("result", result);
        res.send("PAIR_EDIT SUCCESS");
      }
    }
  );
});

app.post(USER_WORD_FLAG, (req, res) => {
  const username = req.body.username;
  const fromLanguage = req.body.fromLanguage;
  const id = req.body.id;
  const word = req.body.word;
  const positive = req.body.positive;

  console.log("USER_WORD_FLAG", username, id);

  if (positive) {
    User.updateOne(
      { username: username },
      {
        $push: { flaggedWords: { language: fromLanguage, id: id, word: word } },
      },
      function (error, success) {
        if (error) {
          console.log(error);
          res.status(500).send("updated fail");
        } else {
          console.log(success);
          res.status(200).send("updated");
        }
      }
    );
  } else {
    User.updateOne(
      { username: username },
      {
        $pull: { flaggedWords: { language: fromLanguage, word: word } },
      },
      function (error, success) {
        if (error) {
          console.log(error);
          res.status(500).send("removed flagged fail");
        } else {
          console.log(success);
          res.status(200).send("removed flagged success");
        }
      }
    );
  }
});

// app.post(USER_GET_ALL_FLAGGED, (req, res) => {
//   const username = req.body.username;
//   const fromLanguage = req.body.fromLanguage;

//   console.log("USER_GET_ALL_FLAGGED", username, fromLanguage);

//   User.find({ username: username }, { flaggedWords }, function(error, success) {
//     if (error) {
//       console.log(error);
//       res.status(500).send("updated fail");
//     } else {
//       console.log(success);
//       res.status(200).send(success);
//     }
//   });
// });

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

// app.post("/languages/delete/:word", (req, res) => {
//   console.log("removing", req.params.word);
//   Language.deleteOne({ word: req.params.word }, err => {
//     if (err) {
//       console.log("err", err);
//       res.send("NOT_DELETED");
//     } else {
//       console.log("deleted");
//       res.send("DELETED_SUCCESSFULLY");
//     }
//   });
// });

app.post(LOG_USER_ACTION, async (req, res) => {
  const word = req.body.word;
  const fromLanguage = req.body.fromLanguage;
  const toLanguage = req.body.toLanguage;
  const username = req.body.username;
  const success = req.body.success;
  const action = req.body.action;

  try {
    let position = req.body.position;
    Log.create({
      word: word,
      toLanguage: toLanguage,
      fromLanguage: fromLanguage,
      username: username,
      success: success,
      action: action,
      position: position,
    });

    console.log("LOG_SUCCESS");

    const dict = await dictGetTotalWords(fromLanguage, toLanguage);
    DICT_SIZE = dict.totalWords;

    const user = await getMoveSpeed(username);
    console.log("move speed", user);
    MOVE_SPEED = 250;
    if (
      user.moveSpeed &&
      Array.isArray(user.moveSpeed) &&
      user.moveSpeed.length
    ) {
      const skus = user.moveSpeed.find(
        (m) => m.fromLanguage === fromLanguage && m.toLanguage === m.toLanguage
      );
      if (skus) {
        MOVE_SPEED = skus.moveSpeed;
      }
    }

    console.log(">>>success", success, position, MOVE_SPEED);
    if (success) {
      newPosition = position + Math.floor(MOVE_SPEED * UP * Math.random());
    } else {
      newPosition = position - Math.floor(MOVE_SPEED * DOWN * Math.random());
    }

    console.log("DICT_SIZE", DICT_SIZE);
    newPosition = Math.max(0, Math.min(DICT_SIZE, newPosition));
    console.log("newPosition", newPosition);
    let positions = []; //positions is array of objects {position, fromLanguage, toLanguage}
    try {
      positionsA = await User.findOne(
        { username: username },

        (err, positions) => {
          if (err) {
            console.log("error getting user positions");
            res.send("error getting user positions");
          } else {
            return positions;
          }
        }
      );
      //   console.log("User find One yes", positionsA);
      positions = positionsA.positions;
    } catch (e) {
      console.log("catch e", e);
      positions = [
        {
          fromLanguage: fromLanguage,
          toLanguage: toLanguage,
          position: newPosition,
        },
      ];
    }

    console.log("positions awaited", positions);

    if (!positions) {
      positions = [
        {
          fromLanguage: fromLanguage,
          toLanguage: toLanguage,
          position: newPosition,
        },
      ];
    }

    if (
      !positions.find((p) => {
        return p.fromLanguage === fromLanguage && p.toLanguage === toLanguage;
      })
    ) {
      positions.push({
        fromLanguage: fromLanguage,
        toLanguage: toLanguage,
        position: newPosition,
      });
    } else {
      positions.forEach((p) => {
        if (p.fromLanguage === fromLanguage && p.toLanguage === toLanguage) {
          p.position = newPosition;
        }
      });
    }

    console.log("Updated positions ", positions);
    //teraz mi treba vratit pozicie na FE a updatnut to tam
    await User.updateOne(
      { username: username },
      { positions: positions },
      (err, suc) => {
        if (err) {
          console.log("err", err);
          res.send("error updating user positions");
        } else {
          console.log("positions updated successfully");
          return;
          //res.send("userSettings_TO_SUCCESS");
        }
      }
    );

    const newMoveSpeed = Math.max(10, MOVE_SPEED - 10);

    setMoveSpeed(username, fromLanguage, toLanguage, newMoveSpeed);

    console.log("sending positions", positions);
    res.status(200).send({ position: newPosition, moveSpeed: newMoveSpeed });
  } catch (e) {
    console.log("error", e);
    res.status(500).send("LOG_FAIL");
  }
});

app.post(USER_PROGRESS_GET_TWENTY_FOUR, (req, res) => {
  var startTime = process.hrtime();

  const fromLanguage = req.body.fromLanguage;
  const toLanguage = req.body.toLanguage;
  const username = req.body.username;
  console.log("USER_PROGRESS_GET");
  try {
    // optimalization needed if I knew how to use aggregate better
    Log.aggregate([
      {
        $match: {
          createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          toLanguage: toLanguage,
          fromLanguage: fromLanguage,
          username: username,
        },
      },
    ]).exec((err, result) => {
      if (err) {
        console.log("err", err);
      } else {
        //console.log("result", result);
        let good = 0;
        let bad = 0;
        result.forEach((r) => {
          if (r.success) {
            good++;
          } else {
            bad++;
          }
        });

        console.log("good / bad", good, bad);
        var elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));

        res.send({
          last24hours: {
            good: good,
            bad: bad,
            lookupTime: elapsedSeconds,
          },
        });
      }
    });

    console.log("USER_PROGRESS_GET SUCCCESS");
  } catch (e) {
    console.log("error", e);
    res.status(500).send("USER_PROGRESS_GET FAIL");
  }
});

// app.post("/frequency/add", (req, res) => {
//   console.log("freq add", req.body.id, req.body.word);
//   try {
//     Frequent.create({
//       id: req.body.id,
//       word: req.body.word
//     });
//     console.log("frequency added");
//     res.send("FREQUENCY_ADD_SUCCESS");
//   } catch (e) {
//     console.log("frequency err", e);
//     res.send("FREQUENCY_ADD_FAIL");
//   }
// });

app.post("/frequency/addArray", (req, res) => {
  console.log("freq add array", req.body.array);
  try {
    let id = 0;
    const array = req.body.array;
    Frequent.remove({}, (err, suc) => {
      if (err) {
        console.log("error deleting", err);
      } else {
        console.log("suc", suc);

        array.forEach((word) => {
          console.log("id", id, word);
          Frequent.create({ id: id, word: word }, (err, res) => {
            if (err) {
              console.log("err", err);
            } else {
              console.log("res", res);
            }
          });
          id++;
        });
      }
    });
    console.log(`frequencies ${id} added`);

    res.send("FREQUENCY_ADD_SUCCESS");
  } catch (e) {
    console.log("frequency err", e);
    res.send("FREQUENCY_ADD_FAIL");
  }
});

//// FILE UPLOAD START ////
// const app = express();
// app.use(bodyParser.json());
// app.use(
//   bodyParser.urlencoded({
//     extended: false,
//   })
// );
// app.use(cors());

// app.use("/public", express.static("public"));

var publicDir = require("path").join(__dirname, "/public");
console.log("ppublicDir", publicDir);
app.use(express.static(publicDir));

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

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log("Connected to port " + port);
});

// app.listen(8080);

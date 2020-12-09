let express = require("express"),
  multer = require("multer"),
  uuidv4 = require("uuid/v4"),
  router = express.Router();
const DIR = "./public/";
const SUBDIRECTORY = process.env.SUBDIRECTORY ? process.env.SUBDIRECTORY : "";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    cb(null, uuidv4() + "-" + fileName);
  },
});

var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
});

// Pic model
let Task = require("../models/task");

router.post("/user-profile", upload.single("profileImg"), (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  Task.updateOne(
    {
      _id: req.body._id,
    },
    {
      img: url + SUBDIRECTORY + "/public" + "/" + req.file.filename,
    },
    (err, suc) => {
      if (err) {
        console.log("err", err);
      } else {
        console.log("suc", suc);
        res.status(201).json({
          message: "Image saved successfully!",
          userCreated: {
            _id: suc._id,
            profileImg: suc.profileImg,
          },
        });
      }
    }
  );
});

router.get("/all", (req, res, next) => {
  console.log("get all");
  Task.find().then((data) => {
    res.status(200).json({
      message: "Task list retrieved successfully!",
      users: data,
    });
  });
});

module.exports = router;

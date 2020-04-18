let mongoose = require("mongoose");

let taskSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },

  caption: {
    type: String,
    required: false,
  },

  text: {
    type: String,
    required: false,
  },

  color: {
    type: String,
    required: false,
  },

  img: {
    type: String,
    required: false,
  },

  index: {
    type: String,
    required: false,
  },
});

taskSchema.set("timestamps", true);

let Task = (module.exports = mongoose.model("Task", taskSchema));

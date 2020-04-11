let mongoose = require("mongoose");

let taskSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },

  caption: {
    type: String,
    required: true,
  },

  text: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: false,
  },
});

taskSchema.set("timestamps", true);

let Task = (module.exports = mongoose.model("Task", taskSchema));

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const picSchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    profileImg: {
      type: String,
    },
  },
  {
    collection: "pics",
  }
);

module.exports = mongoose.model("Pic", picSchema);

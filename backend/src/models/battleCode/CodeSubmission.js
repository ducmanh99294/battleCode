const mongoose = require("mongoose");

const codeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  code: {
    type: String,
    required: true
  },

  language: {
    type: String,
    default: "python"
  }

}, { timestamps: true });

module.exports = mongoose.model("CodeSubmission", codeSchema);
"use strict";

const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  image: String,
  title: String,
  content: String,
  author: String,
  date: String,
});

module.exports = postSchema;

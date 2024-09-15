"use strict";

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const postSchema = new mongoose.Schema({
  image: String,
  title: String,
  content: String,
  author: String,
  date: String,
});

module.exports = { userSchema, postSchema };

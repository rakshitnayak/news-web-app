require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// var md5 = require("md5");//level 4 authentication

/**using salting + hashing with bcrypt package */
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//1st step to connect mongoose to application after requiring mongoose.
let uri = `mongodb+srv://users:${process.env.DB_PW}@cluster0.6kynm.mongodb.net/`;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

//schema for password and email storages of admins
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const postSchema = {
  image: String,
  title: String,
  content: String,
  author: String,
  date: String,
};

const Post = mongoose.model("Post", postSchema);

let posts = [];

app.get("/", function (req, res) {
  Post.find({}, function (err, posts) {
    res.render("home", {
      posts: posts,
    });
  });
});

app.get("/posts", function (req, res) {
  res.render("post", {});
});
app.get("/articles", function (req, res) {
  res.render("post", {});
});
app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/compose");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/compose");
      });
    }
  });
});

app.post("/compose", function (req, res) {
  const post = new Post({
    image: req.body.postImage,
    title: req.body.postTitle,
    content: req.body.postBody,
    author: req.body.postAuthor,
    date: req.body.postDate,
  });

  post.save(function (err) {
    if (!err) {
      res.redirect("/");
    }
  });
});

app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;

  Post.findOne({ _id: requestedPostId }, function (err, post) {
    res.render("post", {
      image: post.image,
      title: post.title,
      content: post.content,
      author: post.author,
      date: post.date,
    });
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("server connected");
});

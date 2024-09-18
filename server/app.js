require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const  userSchema = require("./schemas/user");
const postSchema = require("./schemas/post");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    name: "sid",
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 86400,
      sameSite: true,
    },
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

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function (req, res) {
  const { userId } = req.session;
  let loginUserId;
  if (req.isAuthenticated() && userId) {
    loginUserId = userId;
  }
  Post.find({}, function (err, posts) {
    res.render("home", {
      posts: posts,
      loginUserId,
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
  const { userId } = req.session;
  if (req.isAuthenticated()) {
    res.render("compose", { userId: userId });
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
          req.session.userId = req.user.username;
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
        req.session.userId = req.user.username;
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
  console.log("Server listening on Port:", `http://localhost:${port}`);
});

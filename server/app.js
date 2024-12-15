require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = require("./schemas/user");
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
      maxAge: 86400000, // 24 hours
      sameSite: "strict",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Mongoose Connection
const uri = `mongodb+srv://users:${process.env.DB_PW}@cluster0.6kynm.mongodb.net/?retryWrites=true&w=majority`;
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection error:", err));

// Add Passport-Local Mongoose plugin to the user schema
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err));
});

app.get("/", async (req, res) => {
  const { userId } = req.session;
  const loginUserId = req.isAuthenticated() ? userId : null;
  try {
    const posts = await Post.find({});
    res.render("home", {
      posts,
      loginUserId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching posts.");
  }
});

app.get("/posts", (req, res) => {
  res.render("post");
});

app.get("/articles", (req, res) => {
  res.render("post");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/compose", (req, res) => {
  const { userId } = req.session;
  if (req.isAuthenticated()) {
    res.render("compose", { userId });
  } else {
    res.redirect("/login");
  }
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.error(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          req.session.userId = user.username;
          res.redirect("/compose");
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, (err) => {
    if (err) {
      console.error(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        req.session.userId = req.user.username;
        res.redirect("/compose");
      });
    }
  });
});

app.post("/compose", async (req, res) => {
  const post = new Post({
    image: req.body.postImage,
    title: req.body.postTitle,
    content: req.body.postBody,
    author: req.body.postAuthor,
    date: req.body.postDate,
  });

  try {
    await post.save();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving post.");
  }
});

app.get("/posts/:postId", async (req, res) => {
  const requestedPostId = req.params.postId;

  try {
    const post = await Post.findById(requestedPostId);
    if (post) {
      res.render("post", {
        image: post.image,
        title: post.title,
        content: post.content,
        author: post.author,
        date: post.date,
      });
    } else {
      res.status(404).send("Post not found.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching post.");
  }
});

// Dynamic Port Handling
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server listening on Port:", `http://localhost:${port}`);
});

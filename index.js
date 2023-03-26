import { kMaxLength } from "buffer";
import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose
  .connect("mongodb://127.0.0.1:27017/", {
    dbName: "backend",
  })
  .then(() => {
    console.log("Database Connected!");
  })
  .catch((e) => {
    console.log(e);
  });

const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  hashPassword: String,
});

const Message = mongoose.model("Message", messageSchema);
const User = mongoose.model("User", userSchema);

// const Message = mongoose.model("Messages")

const app = express();

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = Jwt.verify(token, "hghjffjgfdjtfytfdtdtredtrd");

    req.user = await User.findById(decoded._id);

    console.log(decoded);

    next();
  } else {
    res.redirect("login.ejs");
  }
};

// app.get("/", (req, res) => {
//   res.render("index.ejs");
// });

app.get("/login.ejs", isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("logout.ejs", { name: req.user.name });
});

app.get("/log", (req, res) => {
  res.render("login.ejs");
});

app.get("/register.ejs", (req, res) => {
  res.render("register.ejs");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });

  if (!user) return res.redirect("register.ejs");

  const Ismatch = await bcrypt.compare(password,user.hashPassword)
  if (!Ismatch)
    return res.render("login.ejs", { email, message: "Incorrect Password" });

  const token = Jwt.sign({ _id: user._id }, "hghjffjgfdjtfytfdtdtredtrd");
  console.log(token);

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.render("logout.ejs", { name: user.name });
});

app.post("/register.ejs", async (req, res, next) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    res.redirect("/login.ejs");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  user = await User.create({ name, email, hashPassword });

  const token = Jwt.sign({ _id: user._id }, "hghjffjgfdjtfytfdtdtredtrd");
  console.log(token);

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/login.ejs");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/log");
});

app.get("/add", async (req, res) => {
  await Message.create({ name: "Gyan", email: "sampleemail@gmail.com" });
  res.send("Nice");
});

app.get("/done.ejs", (req, res) => {
  res.render("done.ejs");
});

app.listen(5000, () => {
  console.log("The app is running at 5000!");
  console.log("Hello");
});

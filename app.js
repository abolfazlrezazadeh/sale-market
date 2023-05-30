const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const mongodbStore = require("connect-mongodb-session")(session);
const csurf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

const fileStorage = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, new Date().toDateString() + " " + file.originalname);
  },
  destination: (req, file, callback) => {
    callback(null, "images");
  },
});

const User = require("./models/user");
const app = express();
let poort = 3009;

app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", "views"); // فایل های نمایشی در پوشه (views)

const adminRouter = require("./routes/admin");
const shopRouter = require("./routes/shop");
const authRouter = require("./routes/auth");
app.get("/error500", (req, res) => {
  res.status(500).render("error/500", {
    pageTitle: "500 error",
    path: "/error500",
    // isAuthenticated: req.session.isLoggedIn,
  });
});
app.get("/error404", (req, res) => {
  res.status(404).render("error/404", {
    pageTitle: "404 error",
    path: "/error404",
    // isAuthenticated: req.session.isLoggedIn,
  });
});

const store = new mongodbStore({
  uri: "mongodb://127.0.0.1:27017/Shop",
  collection: "sessions",
});

// const csrfProtection = csurf();

app.use(
  session({
    secret: "my secret", //encrypt the sessions
    resave: false, // dont save again them
    saveUninitialized: false, //dont want sessions that dont have value
    store: store,
  })
); //session

// app.use(csrfProtection); // protect

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      req.userNickName = user.name;
      req.userName = user.email;
      next();
    })
    .catch((err) => {
      console.log(err);
    });
}); //userId

// app.use( (req, res, next) => {
//   res.locals.csrfToken = req.csrfToken();
//   next();
//   // res.cookie('XSRF-TOKEN', req.csrfToken())
//   // next();
// }); // csrfToken middle ware

const urlencodedParser = bodyParser.urlencoded({ extended: false }); // that changes the datas that posted to json

app.use(
  multer({
    // Use multer
    storage: fileStorage,
    // fileFilter:fileFilter,
  }).single("imageUrl")
);

app.use(urlencodedParser); // that parses incoming request bodies in a middleware before your handlers, available under the req.body property.
app.use("/admin", urlencodedParser, adminRouter);
app.use("/cart", urlencodedParser, shopRouter);
app.use("/delete-cart", urlencodedParser, shopRouter);
app.use("/shop", urlencodedParser, shopRouter);
app.use(shopRouter);
app.use("/signup", urlencodedParser, authRouter);
app.use("/login", urlencodedParser, authRouter);
app.use("/reset", urlencodedParser, authRouter);
app.use(express.static(path.join(__dirname, "public"))); // my static files(images and else) in public folder
app.use("/images", express.static(path.join(__dirname, "images"))); // for uploden files
app.use(flash()); //flash

app.use("/admin", adminRouter);
app.use(shopRouter);
app.use(authRouter);

mongoose
  .connect("mongodb://127.0.0.1:27017/Shop")
  .then((result) => {
    app.listen(poort, () => {
      console.log(`listening on port ${poort}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

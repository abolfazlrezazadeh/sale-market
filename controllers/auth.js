const bcrypt = require("bcryptjs");
const cookieParse = require("../utility/cookieParser");
const User = require("../models/user");
const sendMail = require("../utility/emailSender");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

exports.getLogin = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const isLoggedIn = cookieParse(req);
  let message = req.flash("error"); // message is array
  if (message.length > 0) {
    message = message[0]; // the text
  } else {
    message = null;
  }
  res.render("authentication/login", {
    pageTitle: "ورود",
    path: "/login",
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: message,
    succesMessage: req.flash("sign-succes"),
    oldInput: {
      email: email,
      password: password,
    },
    // csrfToken:req.csrfToken(),
  });
};

exports.postLogin = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  // const csrf = req.body._csrf;

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.render("authentication/login", {
      pageTitle: "ورود",
      path: "/login",
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      succesMessage: req.flash("sign-succes"),
      oldInput: {
        email: email,
        password: password,
      },
      // validationErrors: errors.array(),
      // csrfToken: req.csrfToken()
    });
  }

  User.findOne({
    email: email,
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "ایمیل شما نا معتبر است ...!!!؛"); // its sent just 1 time
        return res.redirect("/login");
      }
      bcrypt.compare(password, user.password).then((isMatch) => {
        if (isMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            console.log(err);
            res.redirect("/");
            // csrfToken =req.csrfToken();
            // csrf = req.csrfToken();
          });
        }
        req.flash("error", "پسورد شما نا معتبر است ...!!!؛");
        res.redirect("/login");
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.postLogout = (req, res) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getSignup = (req, res) => {
  const errors = validationResult(req);
  let message = req.flash("sign-error"); // message is array
  if (message.length > 0) {
    message = message[0]; // the text
  } else {
    message = null;
  }
  res.render("authentication/signup", {
    path: "/signup",
    pageTitle: "SignUp",
    isAuthenticated: false,
    validationErrors: errors.array(),
    errorMessage: message,
    oldInput: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },

    // csrfToken: req.csrfToken()
  });
};

exports.postSignup = (req, res) => {
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("authentication/signup", {
      path: "/signup",
      pageTitle: "SignUp",
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      oldInput: {
        email: email,
        name: name,
        password: password,
        confirmPassword: confirmPassword,
      },
      // validationErrors: errors.array(),
      // csrfToken: req.csrfToken()
    });
  }
  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash(
          "sign-error",
          "این ایمیل قبلا ثبت شده است .لطفا ایمیل دیگری را امتحان کنید !!"
        );
        return res.redirect("/signup");
      }
      bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            name: name,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then((result) => {
          req.flash(
            "sign-succes",
            "ثبت نام شما با موفقیت انجام شد .لطفا وارد سایت شوید"
          );
          sendMail({
            subject: "ثبت نام سایت (shop)",
            text: "ثبت نام شما با موفقیت انجام شد",
            userEmail: email,
          });
          res.redirect("/login");
        });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.getReset = (req, res) => {
  res.render("authentication/reset", {
    path: "/reset",
    pageTitle: "reset password",
    resetMessage: req.flash("error1")[0],
  });
};

exports.postReset = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    return res.render("authentication/reset", {
      path: "/reset",
      pageTitle: "reset password",
      resetMessage: errors.array()[0].msg,
    });
  }

  let newToken;
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        req.flash(
          "error1",
          " کاربری با این ایمیل یافت نشد لطفا ایمیل دیگری را امتحان کنید!!"
        );
        return res.redirect("/reset");
      }
      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          console.log(err);
          return res.redirect("reset");
        }
        const token = buffer.toString("hex");
        // newToken = token;
        user.resetToken = token;
        user.expiredDateResetToken = Date.now() + 3600000;
        req.session.isLoggedIn = true;
        user.save();
        //send mail
        res.redirect("/waitPage");
        sendMail({
          subject: "بازیابی رمز عبور",
          userEmail: req.body.email,
          html: `<p>درخواست بازیابی رمز عبور</p>
    <p>برای بازیابی رمز عبور روی <a href="http://localhost:3009/reset/${token}">این لینک کلیک کنید</a></p>
    `,
        });
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.getWaitPage = (req, res) => {
  res.render("authentication/waitPage", {
    path: "/Wait page",
    pageTitle: "New password",
    // resetMessage: req.flash("error1")[0],
  });
};

exports.getResetPassword = (req, res) => {
  const token = req.params.token; //get token from url
  User.findOne({
    resetToken: token,
    // expiredDateResetToken: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        return res.redirect("/login");
      }
      // console.log(user);
      res.render("authentication/reset-password", {
        path: "/reset-password",
        pageTitle: "New password",
        errorMessage: req.flash("error1")[0],
        userId: user._id,
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.postResetPassword = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    return res.render("authentication/reset-password", {
      path: "/reset-password",
      pageTitle: "New password",
      errorMessage: errors.array()[0].msg,
    });
  }

  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  const newPassword = req.body.password;
  const salt = bcrypt.genSalt(12);
  let resetUser;
  User.findOne({
    resetToken: passwordToken,
    expiredDateResetToken: { $gt: Date.now() }, //about One hour more than now
    _id: userId,
  })
    .then(async function (user) {
      console.log(user);
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.expiredDateResetToken = undefined;
      return resetUser.save();
    })
    .then((result) => {
      console.log(result);
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.getEditUser = (req, res) => {
  const errors = validationResult(req);
  let message = req.flash("sign-error"); // message is array
  if (message.length > 0) {
    message = message[0]; // the text
  } else {
    message = null;
  }
  res.render("shop/userPanel", {
    path: "/Edit user",
    errorMessage: "",
    pageTitle: "user Information",
    userNickName: req.userNickName,
    userName: req.userName,
    resetMessage: req.flash("error1")[0],
  });
};

exports.postEditUser = (req, res) => {
  const email = req.body.email;
  const name = req.body.name;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.render("shop/userPanel", {
      path: "/Edit user",
      pageTitle: "user Information",
      errorMessage: errors.array()[0].msg,
      userNickName: req.userNickName,
      userName: req.userName,
      // resetMessage: req.flash("error1")[0],
    });
  }
  User.findOne({ email: req.userName })
    .then((user) => {
      // console.log(user);
      user.email = email;
      user.name = name;
      return user.save();
    })
    .then((result) => {
      console.log("user updated");
      // res.redirect("/Edit-User");
      req.flash("sign-succes", "اطلاعات شما با موفقیت ویرایش شد");
      return res.render("shop/userPanel", {
        path: "/Edit user",
        errorMessage: "",
        pageTitle: "user Information",
        userNickName: req.userNickName,
        userName: req.userName,
        resetMessage: req.flash("sign-succes")[0],
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

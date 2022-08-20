const express = require("express");
const router = express.Router();
const errorController = require("../controllers/error");

router.get("/error500", (req, res) => {
  res.status(500).render("error/500", {
    pageTitle: "500 error",
    path: "/error500",
    isAuthenticated: req.session.isLoggedIn,
  });
});
router.get("/error404", (req, res) => {
  res.status(500).render("error/404", {
    pageTitle: "404 error",
    path: "/error404",
    isAuthenticated: req.session.isLoggedIn,
  });
});

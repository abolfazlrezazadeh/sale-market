const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const { check,body } = require("express-validator");

//if its not logged in redirect to login page
const isLoggedIn = require('../middleWare/is-loggedIn');

router.get("/add-product",body("title").isEmpty().withMessage('لطفا مقادیر وورودی را کامل کنید!!') , isLoggedIn, adminController.getAddProduct);
router.post("/add-product",isLoggedIn, adminController.postAddProduct);
router.get("/products", isLoggedIn, adminController.getProducts);
router.get("/edit-product/:productId", isLoggedIn, adminController.getEditProduct);
router.post('/edit-product', isLoggedIn, adminController.postEditProduct);
router.post('/delete-product', isLoggedIn, adminController.postDeleteProduct);

module.exports = router;
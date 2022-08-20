const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop");
const isLoggedIn = require("../middleWare/is-loggedIn");

router.get("/", shopController.getIndex); //main page

router.get("/products/:productId", shopController.getProduct); // product details

router.get("/main-products", shopController.getMainProducts);

router.post("/cart", shopController.postCart);

router.get("/get-cart", shopController.getCart);

router.post("/delete-cart", shopController.deletePostedCart);

router.post("/increase-quantity", shopController.postIncreaseQuantity);

router.post("/decrease-quantity", shopController.postDecreaseQuantity);

router.post("/creat-order", shopController.postOrder);

router.get("/orders", shopController.getOrder);

router.get("/invoices/:orderId", isLoggedIn, shopController.getInvoices);

router.post("/search-products", shopController.postSearchProduct);

router.post("/grouping-products", shopController.getGroupingProducts);

router.post('/post-comment',shopController.postComment);

module.exports = router;

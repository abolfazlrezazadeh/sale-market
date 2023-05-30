const Product = require("../models/product");
const Order = require("../models/order");
const path = require("path");
const fs = require("fs");
const pdfDocument = require("pdfkit");

const ITEMS_PER_PAGE = 2;
exports.getIndex = (req, res) => {
  const page = req.query.page;
  let totalItems;

  Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .then((products) => {
      res.render("shop/index", {
        path: "/",
        pageTitle: "Home",
        prods: products, // prods === products
        isAuthenticated: req.session.isLoggedIn,
        userName: req.userName,
        searchbox: "",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error404");
    });
};

exports.getProduct = (req, res) => {
  const prodId = req.params.productId; //ایدی را هنگام صدا زدن از مونگو پاس میدیم
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-details", {
        product: product,
        productC: "",
        pageTitle: product.title,
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
        userName: req.userName,
        searchbox: "",
      });
    }) //.then()
    .catch((err) => {
      console.log(err);
    });
};

exports.getMainProducts = (req, res) => {
  const page = req.query.page;
  console.log(page);
  Product.find()
    .then((products) => {
      res.render("shop/products-list", {
        path: "/main-products",
        pageTitle: " All Products",
        prods: products, // prods === products
        isAuthenticated: req.session.isLoggedIn,
        userName: req.userName,
        searchbox: "",
        // success :req.flash("success")[0],
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postCart = (req, res) => {
  // const prodId = "62c936294961519065af192e";
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      req.user.addToCart(product);
      // req.flash("success","محصول با موفقیت به سبد خرید اضافه شد");
      console.log("product added");
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCart = async (req, res, next) => {
  const user = await req.user.populate("cart.items.productId");
  res.render("shop/cart", {
    pageTitle: "Cart",
    path: "/get-cart",
    products: user.cart.items,
    isAuthenticated: req.session.isLoggedIn,
    userName: req.userName,
    searchbox: "",
  });
};

exports.postIncreaseQuantity = (req, res) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      req.user.addToCart(product);
      console.log("product added");
      res.redirect("/get-cart");
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.postDecreaseQuantity = (req, res) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      req.user.decreaseQuantity(product);
      console.log("product decreased");
      res.redirect("/get-cart");
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.deletePostedCart = (req, res) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((resault) => {
      console.log(resault);
      res.redirect("/get-cart");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postOrder = (req, res) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return {
          quantity: i.quantity,
          product: {
            ...i.productId._doc,
          }, //get copy
        };
      });
      const order = new Order({
        user: {
          name: req.user.name,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.getOrder = (req, res) => {
  Order.find({
    "user.userId": req.user._id,
  })
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "orders",
        path: "/orders",
        orders: orders,
        isAuthenticated: req.session.isLoggedIn,
        userName: req.userName,
        searchbox: "",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.getInvoices = (req, res, next) => {
  const orderId = req.params.orderId;
  // check just product owner can get the file
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        next(new Error("unauthorized"));
        return res.redirect("/error404");
      }
      // if the id doesnt match with req`s id
      if (order.user.userId.toString() !== req.user._id.toString()) {
        next(new Error("unauthorized"));
        return res.redirect("/error404");
      }
      //it doesnt work and i write it with another way
      const invoiceName = "invoice-" + orderId + ".pdf";
      // addres of the file
      const invoicePath = path.join(
        "files",
        "invoices",
        "invoice-" + orderId + ".pdf"
      );
      // make model of pdfDocument
      const doc = new pdfDocument();

      //set header for the file
      res.setHeader("Content-Type", "application/pdf");
      // inline === download yourself
      // attachment === browser download it-self
      res.setHeader(
        "content-Disposition",
        /*'attachmant'*/ '  inline,filename="' +
          ("invoice-" + orderId + ".pdf") +
          '"'
      );

      doc.pipe(fs.createWriteStream(invoicePath));
      // put doc in response
      doc.pipe(res);

      doc.text("invoices:");
      // make content of pdf
      doc.text("-----------------");
      // .font("fonts/PalatinoBold.ttf")
      // .fontSize(25);
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;

        doc.text(
          prod.quantity +
            " x " +
            prod.product.price +
            " = " +
            totalPrice +
            " Rial "
        );
      });
      //finish the mission
      doc.end();
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/error404");
    });
};

exports.postSearchProduct = (req, res) => {
  const searchBox = req.body.search;
  // $regex = regular expression
  Product.find({ title: { $regex: ".*" + searchBox + ".*" } })
    .then((products) => {
      console.log(products);
      res.render("shop/products-list", {
        path: "/search-products",
        pageTitle: " Searched Products",
        prods: products, // prods === products
        isAuthenticated: req.session.isLoggedIn,
        userName: req.userName,
        searchbox: searchBox,
        // success :req.flash("success")[0],
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error404");
    });
};

exports.getGroupingProducts = (req, res) => {
  const grouping = req.body.grouping;
  console.log(grouping);

  Product.find({ grouping: grouping })
    .then((products) => {
      // console.log(products);
      res.render("shop/products-list", {
        path: "/grouping-products",
        pageTitle: " grouped Products",
        prods: products, // prods === products
        isAuthenticated: req.session.isLoggedIn,
        userName: req.userName,
        searchbox: "",
        // success :req.flash("success")[0],
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error404");
    });
};

exports.postComment = (req, res) => {
  console.log(req.body.comment);
  const commentVal = req.body.comment;
  const prodId = req.params.productId;
  const productId = req.body.productId;

  // if (prodId === productId) {
  Product.findById(prodId)
    .then((prod) => {
      prod.comment += "jdcbkjbjkscb"; //commentVal.toString();
      return prod.save();
    })
    .then((result) => {
      console.log("comment added");
    })
    .then((product) => {
      res.render("shop/product-details", {
        productC: product.comment,
        pageTitle: product.title,
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
        userName: req.userName,
        searchbox: "",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
  // }
};

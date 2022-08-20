const Product = require("../models/product");
const { validationResult } = require("express-validator");
const fileHelper = require("../utility/file");

exports.getProducts = (req, res) => {
  Product.find()
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "admin products",
        path: "/admin/products",
        isAuthenticated: req.session.isLoggedIn,
        userName: req.userName,
        searchbox: "",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// fist the client mustt get the form
exports.getAddProduct = (req, res) => {
  const Title = req.body.title;
  const Price = req.body.price;
  const Description = req.body.description;
  const grouping = req.body.grouping;
  res.render("admin/add-product", {
    path: "/admin/add-product",
    pageTitle: "Add Product",
    editing: false,
    isAuthenticated: req.session.isLoggedIn,
    userName: req.userName,
    product: {
      Title: Title,
      Price: Price,
      Description: Description,
      grouping: grouping,
    },
    searchbox: "",

    errorMessage: "",
    // addMessage:req.flash('product')[0],
  });
};
// then client can post the datas
exports.postAddProduct = (req, res) => {
  const Title = req.body.title;
  const ImageUrl = req.file.path;
  const Price = req.body.price;
  const Description = req.body.description;
  const grouping = req.body.grouping;
  const errors = validationResult(req);
  console.log(grouping);

  // if the mimeType of images arent from these return error
  const mimeType = ImageUrl.split(".");
  if (
    mimeType[1] === "jpg" ||
    mimeType[1] === "png" ||
    mimeType[1] === "jpeg" ||
    mimeType[1] === "JPG"
  ) {
    const product = new Product({
      title: Title,
      imageUrl: ImageUrl,
      price: Price,
      description: Description,
      grouping: grouping,
      userId: req.user,
      isAuthenticated: req.session.isLoggedIn,
    });
    product
      .save()
      .then((result) => {
        console.log("product added");
        // req.flash('product',"محصول اضافه شد");
        return res.redirect("/admin/add-product");
      })
      .catch((err) => {
        console.log(err);
        return res.redirect("/error500");
      });
  } else {
    return res.render("admin/add-product", {
      path: "/admin/add-product",
      pageTitle: "Add Product",
      editing: false,
      isAuthenticated: req.session.isLoggedIn,
      userName: req.userName,
      errorMessage: "خطا : آدرس عکس، را وارد کنید!!!",
      product: {
        Title: Title,
        Price: Price,
        Description: Description,
      },
    });
  }
};

exports.getEditProduct = (req, res) => {
  const editMode = req.query.edit;
  if (!editMode) {
    //اگر ادیت فالس بود
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        // اگر آیدی به صورت دستی و اشتباه وارد شد
        return res.redirect("/");
      }
      res.render("admin/add-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        isAuthenticated: req.session.isLoggedIn,
        userName: req.userName,
        hasError: false,
        errorMessage: "",
        searchbox: "",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.postEditProduct = (req, res) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.file;
  const updatedDec = req.body.description;
  const updatedGrouping = req.body.grouping;
  Product.findById(prodId)
    .then((product) => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.grouping = updatedGrouping;
      if (updatedImageUrl) {
        //if the image exist replace
        fileHelper.deleteFile(product.imageUrl); // the old path of image
        product.imageUrl = updatedImageUrl.path;
      }
      product.description = updatedDec;
      return product.save();
    })
    .then((result) => {
      console.log("Updated");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

exports.postDeleteProduct = (req, res) => {
  const prodId = req.body.productId;

  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return new Error("product not found");
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.findByIdAndRemove(prodId);
    })
    .then(() => {
      console.log("product deleted");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/error500");
    });
};

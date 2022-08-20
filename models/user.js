const mongoose = require("mongoose");
// const product = require("./product");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: false, //it prevents duplicate names
    minlength: 3,
    maxlength: 15,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    minlength: 8,
    maxlength: 40,
  },
  resetToken: String,
  expiredDateResetToken: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product", // دو پوشه را به هم وصل کردیم
          required: true,
        },
        quantity: {
          // تعداد محصولات
          type: Number,
          required: true,
        },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString(); // ببین کالایی مشابه کالایی ک سفارش داده تو سبد خرید هست؟
  });

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items]; //make copy of cart

  if (cartProductIndex >= 0) {
    // if it exists on cart
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    // if it doesnt exist in cart OR its the first product in cart
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString(); // return all products except the one that is ganna be deleted
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.decreaseQuantity = function (product){
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString(); // ببین کالایی مشابه کالایی ک سفارش داده تو سبد خرید هست؟
  });

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items]; //make copy of cart

  if (cartProductIndex >= 0) {
    // if it exists on cart
    newQuantity = this.cart.items[cartProductIndex].quantity - 1;
    if(newQuantity === 0){
      return console.log(new Error('err'));
    }
    updatedCartItems[cartProductIndex].quantity = newQuantity;

  } else{
    //if it doesnt exist in cart OR its the first product in cart
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save();
}

userSchema.methods.clearCart = function () {
  this.cart = {
    items: [],
  };
  return this.save();
};

module.exports = mongoose.model("User", userSchema);

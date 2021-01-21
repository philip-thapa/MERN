const mongoose = require("mongoose");

const { Schema } = mongoose;

const { ObjectId } = Schema;

const productCartSchema = new Schema({
  product: {
    type: ObjectId,
    ref: "Product",
  },
  name: String,
  count: Number,
  price: Number,
});

const ProductCart = mongoose.model("ProductCart", productCartSchema);

const OrderSchema = new Schema(
  {
    products: [productCartSchema],
    transaction_id: {},
    amount: { type: Number },
    address: String,
    updated: Date,
    status: {
      type: String,
      default: "Out for Delivery",
      enum: [
        "Received",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Out for Delivery",
      ],
    },
    user: {
      type: ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);

module.exports = { Order, ProductCart };

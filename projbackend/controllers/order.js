const { Order, ProductCart } = require("../models/order");
const mailgun = require("mailgun-js");
const DOMAIN = "sandbox6463022163344e6090484d219c26868d.mailgun.org";
const mg = mailgun({ apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN });

exports.getOrderById = (req, res, next, id) => {
  Order.findById(id)
    .populate("products.product", "name price")
    .exec((err, order) => {
      if (err) {
        return res.status(400).json({
          error: "NO order found in DB",
        });
      }
      req.order = order;
      next();
    });
};

exports.createOrder = (req, res) => {
  req.body.order.user = req.profile;
  const order = new Order(req.body.order);
  order.save((err, order) => {
    if (err) {
      return res.status(400).json({
        error: "Failed to save your order in DB",
      });
    }
    res.json(order);
  });
};

exports.getAllOrders = (req, res) => {
  Order.find()
    .populate("user", "_id name")
    .exec((err, order) => {
      if (err) {
        return res.status(400).json({
          error: "No orders found in DB",
        });
      }
      res.json(order);
    });
};

exports.getOrderStatus = (req, res) => {
  res.json(Order.schema.path("status").enumValues);
};

exports.updateStatus = (req, res) => {
  Order.update(
    { _id: req.body.orderId },
    { $set: { status: req.body.status } },
    (err, order) => {
      if (err) {
        return res.status(400).json({
          error: "Cannot update order status",
        });
      }
      res.json(order);
    }
  );
};

exports.sendOrderMail = (req, res) => {
  console.log("EMAIL");
  const { token, email } = req.body;
  console.log(req);
  if (token) {
    const data = {
      from: "philipthapa3@gmail.com",
      to: email,
      subject: "Order Confirmation Detail",
      html: `
          <h2>Thank you for the order</h2>
          <hr />
          <h3>Your order will be deliverd shorty by our agent</h3>
          <p>${process.env.CLIENT_URL}</p>
          `,
    };
    mg.messages().send(data, function (error, body) {
      if (error) {
        console.log("ERROR", error);
        return res.json({
          error: error.message,
        });
      }
      return res.json({
        message: "Email has been sent",
      });
    });
  }
};

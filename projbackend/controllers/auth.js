const User = require("../models/user");
const mailgun = require("mailgun-js");
const DOMAIN = "sandbox6463022163344e6090484d219c26868d.mailgun.org";
const mg = mailgun({ apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN });
const { check, validationResult } = require("express-validator");
var jwt = require("jsonwebtoken");
var expressJwt = require("express-jwt");
const _ = require("lodash");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  "33014760314-helie5d1es4j3gmcgede3gjcf3e8l6cp.apps.googleusercontent.com"
);

exports.signup = (req, res) => {
  const errors = validationResult(req);
  const { name, email, password } = req.body;
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }

  User.findOne({ email }).exec((err, user) => {
    if (user) {
      return res.status(400).json({
        error: "Email is taken",
      });
    }
  });

  //we have to send this token to particular account for verification
  const token = jwt.sign(
    { name, email, password },
    process.env.JWT_ACC_ACTIVATE,
    {
      expiresIn: "50m",
    }
  );

  const data = {
    from: "philipthapa3@gmail.com",
    to: email,
    subject: "Account Activation Link",
    html: `
    <h2>Please click on the link to activate your account </h2>
    <p>${process.env.CLIENT_URL}/authentication/activate/${token}</p>
    <hr />
    <p>This email may contain sensetive information</p>
    <p>${process.env.CLIENT_URL}</p>
    `,
  };

  mg.messages().send(data, function (error, body) {
    if (error) {
      console.log("ERROR", error);
      return res.json({
        error: error.message,
      });
    } else {
      return res.json({
        message: "Email has been sent, kindly activate your account",
      });
    }
  });
};

exports.activateAccount = (req, res) => {
  const { token } = req.body;
  // console.log(token);
  if (token) {
    jwt.verify(
      token,
      process.env.JWT_ACC_ACTIVATE,
      function (error, decodedToken) {
        if (error) {
          return res.status(400).json({ error: "Invalid or expired link" });
        }
        const { name, email, password } = decodedToken;
        User.findOne({ email }).exec((err, founduser) => {
          if (founduser) {
            return res
              .status(400)
              .json({ error: "User with this email already exists" });
          }
          const user = new User({ name, email, password });
          user.save((err, user) => {
            if (err) {
              console.log("Error in signup while account activation", err);
              return res.status(400).json({
                err: "Error activating account",
              });
            }
            res.json({
              name: user.name,
              email: user.email,
              id: user._id,
            });
          });
        });
      }
    );
  } else {
    return res.json({ error: "Something went wrong" });
  }
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res
        .status(400)
        .json({ error: "User with this email doesnot exists" });
    }
    const token = jwt.sign({ _id: user._id }, process.env.RESET_PASSWORD_KEY, {
      expiresIn: "50m",
    });
    const data = {
      from: "philipthapa3@gmail.com",
      to: email,
      subject: "Account Activation Link",
      html: `
      <h1>Please use the following to activate your account</h1>
      <p>${process.env.CLIENT_URL}/resetpassword/${token}</p>
      <hr />
      <p>This email may containe sensetive information</p>
      <p>${process.env.CLIENT_URL}</p>
  `,
    };
    return user.updateOne({ resetLink: token }, (err, success) => {
      if (err) {
        return res.status(400).json({ error: "reset password link error" });
      } else {
        mg.messages().send(data, function (error, body) {
          if (error) {
            return res.json({
              error: err.message,
            });
          }
          return res.json({
            message: "Email has been sent, kindly follow the instruction",
          });
        });
      }
    });
  });
};

exports.resetPassword = (req, res) => {
  const { resetLink, newPassword } = req.body;
  if (resetLink) {
    jwt.verify(
      resetLink,
      process.env.RESET_PASSWORD_KEY,
      function (error, decodedData) {
        if (error) {
          return res
            .status(401)
            .json({ error: "Incorrect token or it is expired" });
        }
        User.findOne({ resetLink }, (error, user) => {
          if (error || !user) {
            return res
              .status(400)
              .json({ error: "User with this token doesnot exist" });
          }
          const obj = {
            password: newPassword,
            resetLink: "",
          };

          user = _.extend(user, obj);

          user.save((err, user) => {
            if (err) {
              return res.status(400).json({ error: "reset password error" });
            } else {
              return res
                .status(200)
                .json({ message: "Your password has been changed" });
            }
          });
        });
      }
    );
  } else {
    return res.status(401).json({ error: "Authentication error!!!" });
  }
};

exports.googlelogin = (req, res) => {
  const { tokenId } = req.body;
  // console.log(tokenId);
  client
    .verifyIdToken({
      idToken: tokenId,
      audience:
        "33014760314-helie5d1es4j3gmcgede3gjcf3e8l6cp.apps.googleusercontent.com",
    })
    .then((response) => {
      const { email_verified, name, email } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (err) {
            return res.status(400).json({
              error: "Something went wrong",
            });
          } else {
            if (user) {
              const token = jwt.sign({ _id: user._id }, process.env.SECRET);
              res.cookie("token", token, { expire: new Date() + 9999 });
              const { _id, name, email, role } = user;
              console.log("FIrst STEP");
              // console.log(user);
              return res.json({ token, user: { _id, name, email, role } });
            } else {
              let password = email + process.env.SECRET;
              let newUser = new User({ name, email, password });
              newUser.save((err, data) => {
                if (err) {
                  console.log("ERRORRR");
                  return res
                    .status(400)
                    .json({ error: "Unable to create a user" });
                }
                const token = jwt.sign({ _id: data._id }, process.env.SECRET);
                // res.cookie("token", token, { expire: new Date() + 9999 }); //TODO:
                const { _id, name, email, role } = data;
                console.log("Second STEP");
                return res.json({ token, user: { _id, name, email, role } });
              });
            }
          }
        });
      }
    });
};

exports.signin = (req, res) => {
  const errors = validationResult(req);
  const { email, password } = req.body;

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "USER email does not exists",
      });
    }

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Email and password do not match",
      });
    }

    //create token
    const token = jwt.sign({ _id: user._id }, process.env.SECRET);
    //put token in cookie
    res.cookie("token", token, { expire: new Date() + 9999 });

    //send response to front end
    const { _id, name, email, role } = user;
    return res.json({ token, user: { _id, name, email, role } });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("token");
  res.json({
    message: "User signout successfully",
  });
};

//protected routes
exports.isSignedIn = expressJwt({
  secret: process.env.SECRET,
  userProperty: "auth",
});

//custom middlewares
exports.isAuthenticated = (req, res, next) => {
  let checker = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!checker) {
    return res.status(403).json({
      error: "ACCESS DENIED",
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "You are not ADMIN, Access denied",
    });
  }
  next();
};

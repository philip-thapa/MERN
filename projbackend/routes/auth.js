var express = require("express");
var router = express.Router();
const { check, validationResult } = require("express-validator");
const {
  signout,
  activateAccount,
  forgotPassword,
  resetPassword,
  googlelogin,
  signup,
  signin,
  isSignedIn,
} = require("../controllers/auth");

router.post(
  "/signup",
  [
    check("name", "name should be at least 3 char").isLength({ min: 3 }),
    check("email", "email is required").isEmail(),
    check("password", "password should be at least 3 char").isLength({
      min: 3,
    }),
  ],
  signup
);

router.post("/email-activate", activateAccount);
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);
router.post("/googlelogin", googlelogin);

router.post(
  "/signin",
  [
    check("email", "email is required").isEmail(),
    check("password", "password field is required").isLength({ min: 1 }),
  ],
  signin
);

router.get("/signout", signout);

module.exports = router;
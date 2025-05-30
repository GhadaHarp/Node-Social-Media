const express = require("express");
const {
  signup,
  login,
  protect,
  verifyToken,
} = require("../controllers/auth.controller");
const router = express.Router();
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/me").post(verifyToken);

module.exports = router;

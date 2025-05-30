const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user.model");
const AppError = require("../utils/appError");
const { promisify } = require("util");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  const token = signToken(newUser._id);
  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!password || !email) {
    return next(new AppError("Incorrect email or password.", 401));
  }
  const user = await User.findOne({ email }).select("+password");
  const correct = user && (await user.correctPassword(password, user.password));
  if (!user || !correct) {
    return next(new AppError("Incorrect email or password.", 401));
  }

  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
    user: user,
  });
});

const verifyToken = catchAsync(async (req, res, next) => {
  let { token } = req.body;
  if (!token?.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized.Please log in", 401));
  }
  token = token.split(" ")[1];
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("Inavlid Token.Please log in.", 401));
  }
  res.status(200).json({
    status: "success",
    message: "Valid Token",
    user: currentUser,
  });
});

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

module.exports = {
  signup,
  login,
  protect,
  verifyToken,
};

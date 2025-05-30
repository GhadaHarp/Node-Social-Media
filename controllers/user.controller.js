const User = require("../models/user.model");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    User.find().populate("friends", "name"),
    req.query
  )

    .filter()
    .sort()
    .limitFields();
  const users = await features.query;
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});
const getUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const user = await User.findById(userId).populate("friends", "name");
  if (!user) {
    return next(new AppError(`No Post found with id: ${userId}`, 404));
  }
  res.status(200).json({
    status: "success",
    data: user,
  });
});

const updateUser = catchAsync();
const updateProfilePicture = catchAsync(async (req, res, next) => {
  const imageUrl = req.file?.path;
  if (!imageUrl) {
    return next(new AppError("Please provide a valid Image URL.", 400));
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: imageUrl,
    },
    { new: true }
  );

  res.status(201).json({
    status: "success",
    data: updatedUser,
  });
});
const updateUserProfile = catchAsync(async (req, res, next) => {
  const { name, email, bio } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (email) updates.email = email;
  if (bio) updates.bio = bio;

  if (req.file?.path) {
    updates.avatar = req.file.path;
  }
  if (Object.keys(updates).length === 0) {
    return next(new AppError("No valid fields provided to update.", 400));
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const user = await User.findByIdAndDelete(userId, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(new AppError(`No Post found with id: ${userId}`, 404));
  }
  res.status(200).json({
    status: "success",
    message: "User deleted successfully",
    data: null,
  });
});
module.exports = {
  updateProfilePicture,
  updateUserProfile,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
};

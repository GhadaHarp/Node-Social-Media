const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Comment = require("../models/comment.model");

const getPostComments = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  if (!postId) {
    return next(new AppError(`No post found with id: ${postId}`, 404));
  }
  const features = new APIFeatures(
    Comment.find({ post: postId }).populate("author", "_id name avatar"),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const comments = await features.query;
  res.status(200).json({
    status: "success",
    results: comments.length,
    data: {
      comments,
    },
  });
});
const getComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId).populate(
    "author",
    "_id name avatar"
  );
  if (!comment) {
    return next(new AppError(`No comment found with id: ${commentId}`, 404));
  }
  res.status(200).json({
    status: "success",
    data: comment,
  });
});

const createComment = catchAsync(async (req, res, next) => {
  const { text } = req.body;
  const { postId } = req.params;

  if (!postId) {
    return next(new AppError(`Post ID is required`, 400));
  }
  if (!text) {
    return next(new AppError(`Comment text is required`, 400));
  }

  let newComment = await Comment.create({
    author: req.user._id,
    post: postId,
    text,
  });

  newComment = await newComment.populate("author", "name email");

  res.status(201).json({
    status: "success",
    data: newComment,
  });
});

const updateComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const comment = await Comment.findByIdAndUpdate(commentId, req.body, {
    new: true,
    runValidators: true,
  }).populate("author", "_id name avatar");
  if (!comment) {
    return next(new AppError(`No comment found with id: ${commentId}`, 404));
  }
  res.status(200).json({
    status: "success",
    data: comment,
  });
});
const deleteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const comment = await Comment.findByIdAndDelete(commentId, {
    new: true,
    runValidators: true,
  }).populate("author", "_id name avatar");
  if (!comment) {
    return next(new AppError(`No Comment found with id: ${commentId}`, 404));
  }
  res.status(200).json({
    status: "success",
    message: "Comment deleted successfully",
    data: null,
  });
});

module.exports = {
  getPostComments,
  createComment,
  deleteComment,
  updateComment,
  getComment,
};

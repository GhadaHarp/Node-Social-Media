const Post = require("../models/post.model");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const User = require("../models/user.model");

const getAllPosts = catchAsync(async (req, res, next) => {
  // Clone the initial query without pagination to count the matching docs
  const baseQuery = Post.find();
  const filteredFeatures = new APIFeatures(baseQuery, req.query).filter();

  const filteredPostsCount = await filteredFeatures.query
    .clone()
    .countDocuments();

  const features = new APIFeatures(
    Post.find().populate("author", "name _id avatar"),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const posts = await features.query;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  res.status(200).json({
    status: "success",
    results: posts.length,
    totalFiltered: filteredPostsCount,
    hasMore: skip + posts.length < filteredPostsCount,
    data: { posts },
  });
});

const getPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const post = await Post.findById(postId).populate("comments");
  if (!post) {
    return next(new AppError(`No Post found with id: ${postId}`, 404));
  }
  res.status(200).json({
    status: "success",
    data: post,
  });
});

const createPost = catchAsync(async (req, res, next) => {
  const { title, content } = req.body;

  // With CloudinaryStorage, the image is already uploaded
  let imageUrl = req.file?.path || ""; // path holds the Cloudinary URL

  const newPost = await Post.create({
    author: req.user._id,
    title,
    content,
    image: imageUrl,
  });

  res.status(201).json({
    status: "success",
    data: newPost,
  });
});

const updatePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const updateFields = { ...req.body };

  if (req.file && req.file.path) {
    updateFields.image = req.file.path;
  }

  if ("image" in req.body && req.body.image === "null") {
    updateFields.image = null;
  }

  const post = await Post.findByIdAndUpdate(postId, updateFields, {
    new: true,
    runValidators: true,
  });

  if (!post) {
    return next(new AppError(`No Post found with id: ${postId}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: post,
  });
});

const deletePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const post = await Post.findByIdAndDelete(postId, {
    new: true,
    runValidators: true,
  });
  if (!post) {
    return next(new AppError(`No Post found with id: ${postId}`, 404));
  }
  res.status(200).json({
    status: "success",
    message: "Post deleted successfully",
    data: null,
  });
});

const sharePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const originalPost = await Post.findById(postId);
  if (!originalPost) {
    return next(new AppError(`No Post found with id: ${postId}`, 404));
  }

  const sharedPost = await Post.create({
    title: originalPost.title,
    content: originalPost.content,
    image: originalPost.image,
    author: req.user._id,
    sharedFrom: originalPost._id,
    sharedBy: req.user._id,
  });

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.shares.push(sharedPost._id);
  originalPost.shareCount = (originalPost.shareCount || 0) + 1;
  await Promise.all([originalPost.save(), user.save()]);

  const populatedSharedPost = await Post.findById(sharedPost._id).populate(
    "author",
    "name avatar"
  );

  res.status(201).json({
    status: "success",
    data: populatedSharedPost,
  });
});

const likePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) return next(new AppError(`No Post found with id: ${postId}`, 404));

  const userId = req.user._id?.toString();
  if (!userId) return next(new AppError(`Invalid User`, 400));

  const user = await User.findById(userId);
  if (!user) return next(new AppError(`No User found with id: ${userId}`, 404));

  const hasUserLikedPost = post.likes.some((id) => id.toString() === userId);
  const hasPostLikedByUser = user.likes.some((id) => id.toString() === postId);

  if (hasUserLikedPost && hasPostLikedByUser) {
    post.likes = post.likes.filter((id) => id.toString() !== userId);
    user.likes = user.likes.filter((id) => id.toString() !== postId);
  } else {
    if (!hasUserLikedPost) post.likes.push(req.user._id);
    if (!hasPostLikedByUser) user.likes.push(post._id);
  }

  post.likeCount = post.likes.length;

  await Promise.all([post.save(), user.save()]);

  const updatedPost = await Post.findById(post._id).populate(
    "author",
    "name avatar"
  );

  res.status(200).json({
    status: "success",
    data: updatedPost,
  });
});

const bookmarkPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) return next(new AppError(`No Post found with id: ${postId}`, 404));

  const userId = req.user._id?.toString();
  if (!userId) return next(new AppError(`Invalid User`, 400));

  const user = await User.findById(userId);
  if (!user) return next(new AppError(`No User found with id: ${userId}`, 404));

  const hasUserBookmarkedPost = post.bookmarks.some(
    (id) => id.toString() === userId
  );
  const hasPostInUserBookmarks = user.bookmarks.some(
    (id) => id.toString() === postId
  );

  if (hasUserBookmarkedPost && hasPostInUserBookmarks) {
    post.bookmarks = post.bookmarks.filter((id) => id.toString() !== userId);
    user.bookmarks = user.bookmarks.filter((id) => id.toString() !== postId);
  } else {
    if (!hasUserBookmarkedPost) post.bookmarks.push(req.user._id);
    if (!hasPostInUserBookmarks) user.bookmarks.push(post._id);
  }

  post.bookmarkCount = post.bookmarks.length;

  await Promise.all([post.save(), user.save()]);

  const updatedPost = await Post.findById(post._id).populate(
    "author",
    "name avatar"
  );

  res.status(200).json({
    status: "success",
    data: updatedPost,
  });
});

const getUserPosts = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  if (!userId)
    return next(new AppError(`No User found with id: ${userId}`, 404));

  const features = new APIFeatures(
    Post.find({ author: userId }).populate("author", "name _id avatar"),
    req.query
  )
    .filter()
    .sort()
    .limitFields();
  // .paginate();

  const posts = await features.query;

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: { posts },
  });
});

const getLikedPosts = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  if (!userId)
    return next(new AppError(`No User found with id: ${userId}`, 404));

  const features = new APIFeatures(
    Post.find({ likes: userId }).populate("author", "name _id avatar"),
    req.query
  )
    .filter()
    .sort()
    .limitFields();
  // .paginate();

  const posts = await features.query;

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: { posts },
  });
});
const getBookmarkedPosts = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  if (!userId)
    return next(new AppError(`No User found with id: ${userId}`, 404));

  const features = new APIFeatures(
    Post.find({ bookmarks: userId }).populate("author", "name _id avatar"),
    req.query
  )
    .filter()
    .sort()
    .limitFields();
  // .paginate();

  const posts = await features.query;

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: { posts },
  });
});
const getSharedPosts = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  if (!userId)
    return next(new AppError(`No User found with id: ${userId}`, 404));

  const features = new APIFeatures(
    Post.find({ sharedBy: userId }).populate("author", "name _id avatar"),
    req.query
  )
    .filter()
    .sort()
    .limitFields();
  // .paginate();

  const posts = await features.query;

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: { posts },
  });
});

module.exports = {
  getAllPosts,
  createPost,
  deletePost,
  updatePost,
  getPost,
  sharePost,
  likePost,
  getLikedPosts,
  getSharedPosts,
  getUserPosts,
  bookmarkPost,
  getBookmarkedPosts,
};

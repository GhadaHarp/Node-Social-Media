console.log("Registering post routes...");

const express = require("express");
const {
  getAllPosts,
  getPost,
  updatePost,
  deletePost,
  createPost,
  sharePost,
  likePost,
  getLikedPosts,
  getSharedPosts,
  getUserPosts,
  getBookmarkedPosts,
  bookmarkPost,
} = require("../controllers/post.controller");
const { protect } = require("../controllers/auth.controller");
const upload = require("../middlewares/uploadImage");
const {
  getPostComments,
  createComment,
} = require("../controllers/comment.controller");
const router = express.Router();
router
  .route("/")
  .get(getAllPosts)
  .post(protect, upload.single("image"), createPost);
router.get("/likes", protect, getLikedPosts);
router.get("/shares", protect, getSharedPosts);
router.get("/bookmarks", protect, getBookmarkedPosts);
router.get("/mine", protect, getUserPosts);

router.route("/share/:postId").post(protect, sharePost);
router
  .route("/:postId")
  .get(getPost)
  .patch(upload.single("image"), updatePost)
  .delete(deletePost);
router
  .route("/:postId/comments")
  .get(getPostComments)
  .post(protect, createComment);
router.route("/like/:postId").patch(protect, likePost);
router.route("/bookmark/:postId").patch(protect, bookmarkPost);
router.route("/share/:postId").post(protect, sharePost);
module.exports = router;

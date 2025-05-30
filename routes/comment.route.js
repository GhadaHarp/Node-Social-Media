const express = require("express");

const { protect } = require("../controllers/auth.controller");
const {
  getAllComments,
  createComment,
  deleteComment,
  updateComment,
  getComment,
} = require("../controllers/comment.controller");
const router = express.Router();
router
  .route("/:commentId")
  .get(getComment)
  .patch(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;

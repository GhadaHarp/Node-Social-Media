const express = require("express");
const upload = require("../middlewares/uploadImage");
const { protect } = require("../controllers/auth.controller");
const {
  updateProfilePicture,
  getAllUsers,
  getUser,
  deleteUser,
  updateUserProfile,
} = require("../controllers/user.controller");
const router = express.Router();
router
  .route("/")
  .get(getAllUsers)
  .patch(protect, upload.single("avatar"), updateUserProfile);
router.route("/:userId").get(getUser).delete(deleteUser);
router.patch("/avatar", protect, upload.single("avatar"), updateProfilePicture);
module.exports = router;

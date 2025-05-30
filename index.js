const express = require("express");
const morgan = require("morgan");
const { default: mongoose } = require("mongoose");

const cors = require("cors");
const AppError = require("./utils/appError");
const rateLimit = require("express-rate-limit");
const app = express();
app.use(cors({ credentials: true, origin: "*" }));
require("dotenv").config({ path: "./.env" });
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB)
  .then((con) => {
    console.log("MongoDB connected successfully!");
  })
  .catch((err) => {
    console.log(err);
  });
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED REJECTION! 💥", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! 💥", err);
  process.exit(1);
});
const authRouter = require("./routes/auth.route");
const postRouter = require("./routes/post.route");
const CommentRouter = require("./routes/comment.route");
const userRouter = require("./routes/user.route");
const globalErrorHandler = require("./controllers/erro.controller");

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: {
    status: "fail",
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());

app.use("/api", apiLimiter);
app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", CommentRouter);
app.use("/api/users", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

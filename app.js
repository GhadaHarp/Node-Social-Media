const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const AppError = require("./utils/appError");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(cors({ credentials: true, origin: "*" }));

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

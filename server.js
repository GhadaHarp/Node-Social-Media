const { default: mongoose } = require("mongoose");
require("dotenv").config({ path: "./.env" });
const app = require("./app");

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
const PORT = process.env.PORT || 5000;
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

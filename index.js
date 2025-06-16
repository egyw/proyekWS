require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const {
  userRouter,
  RecipeRouter,
  ReviewAiCaloryRouter,
} = require("./src/routes");
const connectDB = require("./src/database/connection");

connectDB();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve static files from the cntohImage directory
app.use("/images", express.static(path.join(__dirname, "./cntohImage")));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/recipes", RecipeRouter);
app.use("/api/v1/reviews", ReviewAiCaloryRouter);

// run server
const port = 3000;
app.listen(port, () => {
  console.log(`Server jalan di port ${port} yaa :)`);
});

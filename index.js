require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { userRouter, RecipeRouter } = require("./src/routes");
const connectDB = require("./src/database/connection");

connectDB();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userRouter);
app.use("/recipes", RecipeRouter);

// run server
const port = 3000;
app.listen(port, () => {
  console.log(`Server jalan di port ${port} yaa :)`);
});

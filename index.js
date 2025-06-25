require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");
const {
  userRouter,
  RecipeRouter,
  ReviewAiCaloryRouter,
  SubscriptionRouter,
} = require("./src/routes");
const connectDB = require("./src/database/connection");

connectDB();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Serve static files from the contohImage directory
app.use("/images", express.static(path.join(__dirname, "./cntohImage")));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/recipes", RecipeRouter);
app.use("/api/v1/reviews", ReviewAiCaloryRouter);
app.use("/api/v1/transaction", SubscriptionRouter);
app.set("trust proxy", true);
// Import models
const User = require("./src/models/User");
const Subscriptions = require("./src/models/Subscriptions");

// Function to update expired subscriptions
const updateExpiredSubscriptions = async () => {
  try {
    const now = new Date();
    const expiredSubscriptions = await Subscriptions.find({
      endDate: { $lte: now },
      paymentStatus: "completed",
    });

    for (const sub of expiredSubscriptions) {
      const user = await User.findById(sub.userId);
      if (user && user.isPremium) {
        user.isPremium = false;
        await user.save();
      }
      sub.status = "expired";
      await sub.save();
    }
  } catch (error) {
    console.error("Error updating expired subscriptions:", error);
  }
};

// Schedule the task to run every day at 00:01 Jakarta time
cron.schedule(
  "1 0 * * *",
  () => {
    console.log("-------------------------------------");
    console.log("Executing scheduled task: updateExpiredSubscriptions");
    updateExpiredSubscriptions();
  },
  {
    scheduled: true,
    timezone: "Asia/Jakarta",
  }
);

// run server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server jalan di port ${port} yaa :)`);
});

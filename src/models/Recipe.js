const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  servings: {
    type: Number,
    required: true,
  },
  readyInMinutes: {
    type: Number,
    required: true,
  },
  preparationMinutes: {
    type: Number,
    required: true,
  },
  cookingMinutes: {
    type: Number,
    required: true,
  },
  ingredients: {
    type: [
      {
        name: {
          type: String,
          required: true,
        },
        measure: {
          type: String,
          required: true,
        },
        _id: false,
      },
    ],
    required: true,
  },
  dishTypes: {
    type: String,
    required: true,
  },
  tags: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
    required: true,
  },
  video: {
    type: String,
    default: null,
  },
  createdByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dateModified: {
    type: Date,
    default: null,
  },
  image: {
    type: String,
    default: null,
  },
  healthScore: {
    type: Number,
    default: null,
  },
  summary: {
    type: String,
    default: null,
  },
  weightWatcherSmartPoints: {
    type: Number,
    default: null,
  },
  calories: {
    type: Number,
    default: null,
  },
  carbs: {
    type: String,
    default: null,
  },
  fat: {
    type: String,
    default: null,
  },
  protein: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("Recipe", recipeSchema);

const Joi = require("joi");
const { Recipe } = require("../../models");

const commentarValidation = Joi.object({
  commentar: Joi.string().min(10).max(500).required().messages({
    "string.min": "Panjang commentar minimal 10 karakter!",
    "string.max": "Panjang commentar maksimal 500 karakter!",
    "any.required": "Commentar harus diisi!",
    "string.empty": "Commentar tidak boleh kosong!",
  }),

  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating harus berupa angka!",
    "number.integer": "Rating harus berupa bilangan bulat!",
    "number.min": "Rating minimal 1!",
    "number.max": "Rating maksimal 5!",
    "any.required": "Rating harus diisi!",
  }),
});

const inputUserValidation = Joi.object({
  userInput: Joi.string().min(10).required().messages({
    "string.min": "Panjang inputan minimal 10 karakter!",
    "any.required": "Inputan harus diisi!",
    "string.empty": "Inputan tidak boleh kosong!",
  }),
});

module.exports = {
  inputUserValidation,
  commentarValidation,
};

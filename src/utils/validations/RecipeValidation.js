const Joi = require("joi");
const { Recipe } = require("../../models");

const recipeValidation = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.min": "Panjang judul minimal 3 karakter!",
    "string.max": "Panjang judul maksimal 100 karakter!",
    "any.required": "Judul harus diisi!",
    "string.empty": "Judul tidak boleh kosong!",
  }),

  servings: Joi.number().integer().min(1).max(20).required().messages({
    "number.base": "Porsi harus berupa angka!",
    "number.integer": "Porsi harus berupa bilangan bulat!",
    "number.min": "Porsi minimal 1!",
    "number.max": "Porsi maksimal 20!",
    "any.required": "Porsi harus diisi!",
  }),

  readyInMinutes: Joi.number().integer().min(1).max(1440).required().messages({
    "number.base": "Waktu siap harus berupa angka!",
    "number.integer": "Waktu siap harus berupa bilangan bulat!",
    "number.min": "Waktu siap minimal 1 menit!",
    "number.max": "Waktu siap maksimal 1440 menit (24 jam)!",
    "any.required": "Waktu siap harus diisi!",
  }),

  preparationMinutes: Joi.number()
    .integer()
    .min(1)
    .max(720)
    .required()
    .messages({
      "number.base": "Waktu persiapan harus berupa angka!",
      "number.integer": "Waktu persiapan harus berupa bilangan bulat!",
      "number.min": "Waktu persiapan minimal 1 menit!",
      "number.max": "Waktu persiapan maksimal 720 menit (12 jam)!",
      "any.required": "Waktu persiapan harus diisi!",
    }),

  cookingMinutes: Joi.number().integer().min(1).max(720).required().messages({
    "number.base": "Waktu memasak harus berupa angka!",
    "number.integer": "Waktu memasak harus berupa bilangan bulat!",
    "number.min": "Waktu memasak minimal 1 menit!",
    "number.max": "Waktu memasak maksimal 720 menit (12 jam)!",
    "any.required": "Waktu memasak harus diisi!",
  }),

  ingredients: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(2).max(200).required().messages({
          "string.min": "Nama bahan minimal 2 karakter!",
          "string.max": "Nama bahan maksimal 200 karakter!",
          "any.required": "Nama bahan harus diisi!",
        }),
        measure: Joi.string().min(1).max(50).required().messages({
          "string.min": "Kuantitas bahan minimal 1 karakter!",
          "string.max": "Kuantitas bahan maksimal 50 karakter!",
          "any.required": "Kuantitas bahan harus diisi!",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Bahan-bahan harus berupa array!",
      "array.min": "Minimal harus ada 1 bahan!",
      "any.required": "Bahan-bahan harus diisi!",
    }),

  dishTypes: Joi.string().min(2).max(50).required().messages({
    "string.min": "Jenis hidangan minimal 2 karakter!",
    "string.max": "Jenis hidangan maksimal 50 karakter!",
    "any.required": "Jenis hidangan harus diisi!",
    "string.empty": "Jenis hidangan tidak boleh kosong!",
  }),

  tags: Joi.string().min(2).max(500).required().messages({
    "string.min": "Tag minimal 2 karakter!",
    "string.max": "Tag maksimal 500 karakter!",
    "any.required": "Tag harus diisi!",
    "string.empty": "Tag tidak boleh kosong!",
  }),

  area: Joi.string().min(2).max(50).required().messages({
    "string.min": "Area minimal 2 karakter!",
    "string.max": "Area maksimal 50 karakter!",
    "any.required": "Area harus diisi!",
    "string.empty": "Area tidak boleh kosong!",
  }),

  instructions: Joi.string().min(10).max(5000).required().messages({
    "string.min": "Instruksi minimal 10 karakter!",
    "string.max": "Instruksi maksimal 5000 karakter!",
    "any.required": "Instruksi harus diisi!",
    "string.empty": "Instruksi tidak boleh kosong!",
  }),

  video: Joi.string().uri().allow(null, "").optional().messages({
    "string.uri": "Video harus berupa URL yang valid!",
  }),

  image: Joi.string().allow(null, "").optional().messages({
    "string.uri": "Gambar harus berupa URL yang valid!",
  }),

  createdByUser: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "ID pengguna tidak valid!",
      "any.required": "ID pengguna harus diisi!",
    }),

  dateModified: Joi.date().allow(null).optional().messages({
    "date.base": "Tanggal modifikasi harus berupa tanggal yang valid!",
  }),

  healthScore: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .allow(null)
    .optional()
    .messages({
      "number.base": "Skor kesehatan harus berupa angka!",
      "number.integer": "Skor kesehatan harus berupa bilangan bulat!",
      "number.min": "Skor kesehatan minimal 0!",
      "number.max": "Skor kesehatan maksimal 100!",
    }),

  summary: Joi.string().max(1000).allow(null, "").optional().messages({
    "string.max": "Ringkasan maksimal 1000 karakter!",
  }),

  weightWatcherSmartPoints: Joi.number()
    .min(0)
    .max(100)
    .allow(null)
    .required()
    .messages({
      "number.base": "Weight Watcher Smart Points harus berupa angka!",
      "number.min": "Weight Watcher Smart Points minimal 0!",
      "number.max": "Weight Watcher Smart Points maksimal 100!",
    }),

  calories: Joi.number().min(0).max(10000).allow(null).required().messages({
    "number.base": "Kalori harus berupa angka!",
    "number.min": "Kalori minimal 0!",
    "number.max": "Kalori maksimal 10000!",
  }),

  carbs: Joi.string().min(0).max(1000).required().messages({
    "string.base": "Karbohidrat harus berupa string!",
    "string.min": "Karbohidrat minimal 0!",
    "string.max": "Karbohidrat maksimal 1000 gram!",
  }),

  fat: Joi.string().min(0).max(1000).required().messages({
    "string.base": "Lemak harus berupa string!",
    "string.min": "Lemak minimal 0!",
    "string.max": "Lemak maksimal 1000 gram!",
  }),

  protein: Joi.string().min(0).max(1000).required().messages({
    "string.base": "Protein harus berupa string!",
    "string.min": "Protein minimal 0!",
    "string.max": "Protein maksimal 1000 gram!",
  }),
});

module.exports = {
  recipeValidation,
};

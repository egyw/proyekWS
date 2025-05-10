const Joi = require('joi');


const customContoh = (value, helpers) => {
    if (value === "-") {
        return helpers.error("any.invalid");
      }
    
      if (value.length != 9) {
        throw new Error("Panjang Invoice tidak betul");
      }
    
      if (value.substr(0, 3) != "INV" && value.substr(0, 3) != "RTR") {
        throw new Error("Harus diawali INV atau RTR");
      }
      // TY go aaron
      // jangan lupa return value
      return value;
};

const contohSchema = Joi.object({
kode_invoice: Joi.string().custom(customContoh),
kota_tujuan: Joi.string().valid("SBY", "JKT", "JBR"),
});

module.exports = contohSchema;
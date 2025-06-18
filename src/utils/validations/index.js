const userValidation = require("./userValidation");
const racValidation = require("./RacValidation");
module.exports = {
  ...userValidation,
  ...racValidation,
};

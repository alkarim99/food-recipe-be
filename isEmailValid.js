const emailValidator = require("deep-email-validator");

const isEmailValid = (email) => {
  return emailValidator.validate({ email, validateSMTP: false });
};

module.exports = isEmailValid;

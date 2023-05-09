const db = require("../database");
const isEmailValid = require("../isEmailValid");

const createUser = async (req, res) => {
  try {
    const { email, fullname, phoneNumber, password, profilePicture } = req.body;
    if (!(email && fullname && phoneNumber && password && profilePicture)) {
      res.status(400).json({
        status: false,
        message: "Bad input, please complete all of fields",
      });
      return;
    }
    const { valid, reason, validators } = await isEmailValid(email);
    if (!valid) {
      res.status(400).json({
        status: false,
        message: "Email is invalid!",
        reason: validators[reason].reason,
      });
      return;
    }
    const emails = await db`SELECT email FROM users`;
    let isUniqeEmail = emails.find((mail) => mail.email === email);
    if (isUniqeEmail) {
      res.status(400).json({
        status: false,
        message: "Email already in use!",
      });
      return;
    }
    if (fullname.length < 3) {
      res.status(400).json({
        status: false,
        message: "Fullname is invalid! Must be greater than or equal to 3",
      });
      return;
    }
    if (phoneNumber.length < 11) {
      res.status(400).json({
        status: false,
        message: "Phone Number is invalid! Must be greater than or equal to 11",
      });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({
        status: false,
        message: "Password is invalid! Must be greater than or equal to 6",
      });
      return;
    }
    const payload = {
      email,
      fullname,
      phoneNumber,
      password,
      profilePicture,
    };
    const query = await db`INSERT INTO users ${db(
      payload,
      "email",
      "fullname",
      "phoneNumber",
      "password",
      "profilePicture"
    )} returning *`;
    res.send({
      status: true,
      message: "Success insert data",
      data: query,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      status: false,
      message: "Check terminal for error message",
    });
  }
};

module.exports = createUser;

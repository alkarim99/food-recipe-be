const db = require("../database");
const isEmailValid = require("../isEmailValid");

const update = async (req, res) => {
  try {
    const {
      params: { id },
      body: { email, fullname, phoneNumber, password, profilePicture },
    } = req;
    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: "ID must be integer",
      });
      return;
    }
    const checkData = await db`SELECT * FROM users where id = ${id}`;
    if (!checkData?.length) {
      res.status(404).json({
        status: false,
        message: `ID ${id} not found`,
      });
      return;
    }
    const payload = {
      email: email ?? checkData[0].email,
      fullname: fullname ?? checkData[0].fullname,
      phoneNumber: phoneNumber ?? checkData[0].phoneNumber,
      password: password ?? checkData[0].password,
      profilePicture: profilePicture ?? checkData[0].profilePicture,
    };
    const { valid, reason, validators } = await isEmailValid(payload.email);
    if (!valid) {
      res.status(400).json({
        status: false,
        message: "Email is invalid!",
        reason: validators[reason].reason,
      });
      return;
    }
    const emails = await db`SELECT email FROM users WHERE id != ${id}`;
    let isUniqeEmail = emails.find((mail) => mail.email === payload.email);
    if (isUniqeEmail) {
      res.status(400).json({
        status: false,
        message: "Email already in use!",
      });
      return;
    }
    if (payload.fullname.length < 3) {
      res.status(400).json({
        status: false,
        message: "Fullname is invalid! Must be greater than or equal to 3",
      });
      return;
    }
    if (payload.phoneNumber.length < 11) {
      res.status(400).json({
        status: false,
        message: "Phone Number is invalid! Must be greater than or equal to 11",
      });
      return;
    }
    if (payload.password.length < 6) {
      res.status(400).json({
        status: false,
        message: "Password is invalid! Must be greater than or equal to 6",
      });
      return;
    }
    const query = await db`UPDATE users SET ${db(
      payload,
      "email",
      "fullname",
      "phoneNumber",
      "password",
      "profilePicture"
    )} WHERE id = ${id} returning *`;
    res.send({
      status: true,
      message: "Success edit data",
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

module.exports = update;

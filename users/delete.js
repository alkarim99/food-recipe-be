const db = require("../database");

const deleteUser = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    const checkData = await db`SELECT * FROM users WHERE id = ${id}`;
    if (!checkData?.length) {
      res.status(404).json({
        status: false,
        message: `ID ${id} not found`,
      });
      return;
    }
    const query = await db`DELETE FROM users WHERE id = ${id} returning *`;
    res.send({
      status: true,
      message: "Success delete data",
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

module.exports = deleteUser;

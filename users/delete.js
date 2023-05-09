const db = require("../database");

const deleteUser = async (req, res) => {
  const {
    params: { id },
  } = req;
  if (isNaN(id)) {
    res.status(400).json({
      status: false,
      message: "ID must be integer",
    });
    return;
  }
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
};

module.exports = deleteUser;

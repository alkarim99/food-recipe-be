const db = require("../database");

const getById = async (req, res) => {
  try {
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
    const query = await db`SELECT * FROM users where id = ${id}`;
    if (!query?.length) {
      res.json({
        status: false,
        message: `ID ${id} not found!`,
      });
    }
    res.json({
      status: true,
      message: "Get success",
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

module.exports = getById;

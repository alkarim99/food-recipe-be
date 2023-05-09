const db = require("../database");

const getAll = async (req, res) => {
  try {
    const query = await db`SELECT * FROM recipes`;
    res.send({
      status: true,
      message: "Get data success",
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

module.exports = getAll;

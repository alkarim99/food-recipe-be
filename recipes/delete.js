const db = require("../database");

const deleteRecipes = async (req, res) => {
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
    const checkData = await db`SELECT * FROM recipes WHERE id = ${id}`;
    if (!checkData?.length) {
      res.status(404).json({
        status: false,
        message: `ID ${id} not found`,
      });
      return;
    }
    const query = await db`DELETE FROM recipes WHERE id = ${id} returning *`;
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

module.exports = deleteRecipes;

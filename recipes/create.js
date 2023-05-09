const db = require("../database");
const isUrlValid = require("../isUrlValid");

const createRecipes = async (req, res) => {
  try {
    const { recipePicture, title, ingredients, videoLink } = req.body;
    if (!(recipePicture && title && ingredients && videoLink)) {
      res.status(400).json({
        status: false,
        message: "Bad input, please complete all of fields",
      });
      return;
    }
    if (title.split(" ").length < 2) {
      res.status(400).json({
        status: false,
        message: "Title is invalid! Must be greater than or equal to 2 words",
      });
      return;
    }
    if (ingredients.split(" ").length < 2) {
      res.status(400).json({
        status: false,
        message:
          "Ingredients is invalid! Must be greater than or equal to 2 ingredients",
      });
      return;
    }
    const checkUrlValid = isUrlValid(videoLink);
    if (!checkUrlValid) {
      res.status(400).json({
        status: false,
        message: "Video Link is invalid!",
      });
      return;
    }
    const payload = {
      recipePicture,
      title,
      ingredients,
      videoLink,
    };
    const query = await db`INSERT INTO recipes ${db(
      payload,
      "recipePicture",
      "title",
      "ingredients",
      "videoLink"
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

module.exports = createRecipes;

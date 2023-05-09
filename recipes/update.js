const db = require("../database");
const isUrlValid = require("../isUrlValid");

const update = async (req, res) => {
  try {
    const {
      params: { id },
      body: { recipePicture, title, ingredients, videoLink },
    } = req;
    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: "ID must be integer",
      });
      return;
    }
    const checkData = await db`SELECT * FROM recipes where id = ${id}`;
    if (!checkData?.length) {
      res.status(404).json({
        status: false,
        message: `ID ${id} not found`,
      });
      return;
    }
    const payload = {
      recipePicture: recipePicture ?? checkData[0].recipePicture,
      title: title ?? checkData[0].title,
      ingredients: ingredients ?? checkData[0].ingredients,
      videoLink: videoLink ?? checkData[0].videoLink,
    };
    if (payload.title.split(" ").length < 2) {
      res.status(400).json({
        status: false,
        message: "Title is invalid! Must be greater than or equal to 2 words",
      });
      return;
    }
    if (payload.ingredients.split(", ").length < 2) {
      res.status(400).json({
        status: false,
        message:
          "Ingredients is invalid! Must be greater than or equal to 2 ingredients. Separate with commas",
      });
      return;
    }
    const checkUrlValid = isUrlValid(payload.videoLink);
    if (!checkUrlValid) {
      res.status(400).json({
        status: false,
        message: "Video Link is invalid!",
      });
      return;
    }
    const query = await db`UPDATE recipes SET ${db(
      payload,
      "recipePicture",
      "title",
      "ingredients",
      "videoLink"
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

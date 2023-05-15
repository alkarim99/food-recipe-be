const db = require("../database")

const getAll = (keyword, sort, userId) => {
  try {
    let query
    if (keyword != null) {
      if (userId != null) {
        query = db`SELECT recipes.id AS recipes_id, *, count(*) OVER() AS full_count FROM recipes JOIN users ON users.id = recipes.user_id WHERE LOWER(recipes.title) LIKE LOWER(${keyword}) and users.id = ${userId} ORDER BY recipes.id ${sort}`
      } else {
        query = db`SELECT *, count(*) OVER() AS full_count FROM recipes WHERE LOWER(recipes.title) LIKE LOWER(${keyword}) ORDER BY recipes.id ${sort}`
      }
    } else if (userId != null) {
      query = db`SELECT *, count(*) OVER() AS full_count FROM recipes JOIN users ON users.id = recipes.user_id WHERE users.id = ${userId} ORDER BY recipes.id ${sort}`
    } else {
      query = db`SELECT *, count(*) OVER() AS full_count FROM recipes ORDER BY recipes.id ${sort}`
    }
    return query
  } catch (error) {
    return error
  }
}

const getById = async (id) => {
  try {
    const query = await db`SELECT * FROM recipes where id = ${id}`
    return query
  } catch (error) {
    return error
  }
}

const create = async (payload) => {
  try {
    const query = await db`INSERT INTO recipes ${db(
      payload,
      "recipePicture",
      "title",
      "ingredients",
      "videoLink",
      "user_id"
    )} returning *`
    return query
  } catch (error) {
    return error
  }
}

const update = async (payload, id) => {
  try {
    const query = await db`UPDATE recipes SET ${db(
      payload,
      "title",
      "ingredients",
      "videoLink",
      "user_id"
    )} WHERE id = ${id} returning *`
    return query
  } catch (error) {
    return error
  }
}

const updatePhoto = async (payload, id) => {
  try {
    const query = await db`UPDATE recipes set ${db(
      payload,
      "recipePicture"
    )} WHERE id = ${id} returning *`
    return query
  } catch (error) {
    return error
  }
}

const deleteRecipe = async (id) => {
  try {
    const query = await db`DELETE FROM recipes WHERE id = ${id} returning *`
    return query
  } catch (error) {
    return error
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  updatePhoto,
  deleteRecipe,
}

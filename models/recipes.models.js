const db = require('../database')

const getAll = (keyword, sort) => {
  try {
    let query
    if (keyword != null) {
      query = db`SELECT *, count(*) OVER() AS full_count FROM recipes WHERE LOWER(recipes.title) LIKE LOWER(${keyword}) ORDER BY id ${sort}`
    } else {
      query = db`SELECT *, count(*) OVER() AS full_count FROM recipes ORDER BY id ${sort}`
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
      'recipePicture',
      'title',
      'ingredients',
      'videoLink'
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
      'recipePicture',
      'title',
      'ingredients',
      'videoLink'
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
  deleteRecipe
}

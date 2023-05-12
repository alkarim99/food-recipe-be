const db = require('../database')

const getAll = async (sortType) => {
  try {
    const query = await db`SELECT * FROM users ORDER BY id ${sortType}`
    return query
  } catch (error) {
    return error
  }
}

const getById = async (id) => {
  try {
    const query = await db`SELECT * FROM users where id = ${id}`
    return query
  } catch (error) {
    return error
  }
}

const create = async (payload) => {
  try {
    const query = await db`INSERT INTO users ${db(
      payload,
      'email',
      'fullname',
      'phoneNumber',
      'password',
      'profilePicture'
    )} returning *`
    return query
  } catch (error) {
    return error
  }
}

const update = async (payload, id) => {
  try {
    const query = await db`UPDATE users SET ${db(
      payload,
      'email',
      'fullname',
      'phoneNumber',
      'password',
      'profilePicture'
    )} WHERE id = ${id} returning *`
    return query
  } catch (error) {
    return error
  }
}

const deleteUser = async (id) => {
  try {
    const query = await db`DELETE FROM users WHERE id = ${id} returning *`
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
  deleteUser
}

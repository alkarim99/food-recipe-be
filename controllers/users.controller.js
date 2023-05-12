const isEmailValid = require('../isEmailValid')
const model = require('../models/users.models')
const db = require('../database')

const getAll = async (req, res) => {
  try {
    let sort = db`DESC`
    if (req?.query?.sortType?.toLowerCase() === 'asc') {
      sort = db`ASC`
    }
    const query = await model.getAll(sort)
    res.send({
      status: true,
      message: 'Get data success',
      data: query
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: 'Error in server'
    })
  }
}

const getById = async (req, res) => {
  try {
    const {
      params: { id }
    } = req
    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: 'ID must be integer'
      })
      return
    }
    const query = await model.getById(id)
    if (!query?.length) {
      res.json({
        status: false,
        message: `ID ${id} not found!`
      })
    }
    res.json({
      status: true,
      message: 'Get success',
      data: query
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: 'Error in server'
    })
  }
}

const create = async (req, res) => {
  try {
    const { email, fullname, phoneNumber, password, profilePicture } = req.body
    if (!(email && fullname && phoneNumber && password && profilePicture)) {
      res.status(400).json({
        status: false,
        message: 'Bad input, please complete all of fields'
      })
      return
    }
    const { valid, reason, validators } = await isEmailValid(email)
    if (!valid) {
      res.status(400).json({
        status: false,
        message: 'Email is invalid!',
        reason: validators[reason].reason
      })
      return
    }
    const emails = await db`SELECT email FROM users`
    const isUniqeEmail = emails.find((mail) => mail.email === email)
    if (isUniqeEmail) {
      res.status(400).json({
        status: false,
        message: 'Email already in use!'
      })
      return
    }
    if (fullname.length < 3) {
      res.status(400).json({
        status: false,
        message: 'Fullname is invalid! Must be greater than or equal to 3'
      })
      return
    }
    if (phoneNumber.length < 11) {
      res.status(400).json({
        status: false,
        message: 'Phone Number is invalid! Must be greater than or equal to 11'
      })
      return
    }
    if (password.length < 6) {
      res.status(400).json({
        status: false,
        message: 'Password is invalid! Must be greater than or equal to 6'
      })
      return
    }
    const payload = {
      email,
      fullname,
      phoneNumber,
      password,
      profilePicture
    }
    const query = await model.create(payload)
    res.send({
      status: true,
      message: 'Success insert data',
      data: query
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: 'Error in server'
    })
  }
}

const update = async (req, res) => {
  try {
    const {
      params: { id },
      body: { email, fullname, phoneNumber, password, profilePicture }
    } = req
    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: 'ID must be integer'
      })
      return
    }
    const checkData = await model.getById(id)
    if (!checkData?.length) {
      res.status(404).json({
        status: false,
        message: `ID ${id} not found`
      })
      return
    }
    const payload = {
      email: email ?? checkData[0].email,
      fullname: fullname ?? checkData[0].fullname,
      phoneNumber: phoneNumber ?? checkData[0].phoneNumber,
      password: password ?? checkData[0].password,
      profilePicture: profilePicture ?? checkData[0].profilePicture
    }
    const { valid, reason, validators } = await isEmailValid(payload.email)
    if (!valid) {
      res.status(400).json({
        status: false,
        message: 'Email is invalid!',
        reason: validators[reason].reason
      })
      return
    }
    const emails = await db`SELECT email FROM users WHERE id != ${id}`
    const isUniqeEmail = emails.find((mail) => mail.email === payload.email)
    if (isUniqeEmail) {
      res.status(400).json({
        status: false,
        message: 'Email already in use!'
      })
      return
    }
    if (payload.fullname.length < 3) {
      res.status(400).json({
        status: false,
        message: 'Fullname is invalid! Must be greater than or equal to 3'
      })
      return
    }
    if (payload.phoneNumber.length < 11) {
      res.status(400).json({
        status: false,
        message: 'Phone Number is invalid! Must be greater than or equal to 11'
      })
      return
    }
    if (payload.password.length < 6) {
      res.status(400).json({
        status: false,
        message: 'Password is invalid! Must be greater than or equal to 6'
      })
      return
    }
    const query = await model.update(payload, id)
    res.send({
      status: true,
      message: 'Success edit data',
      data: query
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: 'Error in server'
    })
  }
}

const deleteUser = async (req, res) => {
  try {
    const {
      params: { id }
    } = req
    const checkData = await model.getById(id)
    if (!checkData?.length) {
      res.status(404).json({
        status: false,
        message: `ID ${id} not found`
      })
      return
    }
    const query = await model.deleteUser(id)
    res.send({
      status: true,
      message: 'Success delete data',
      data: query
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: 'Error in server'
    })
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteUser
}

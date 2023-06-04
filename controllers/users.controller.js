const emailValidation = require("../email.validation")
const bcrypt = require("bcrypt")
const saltRounds = 10
const model = require("../models/users.models")
const db = require("../database")
const jwt = require("jsonwebtoken")
const cloudinary = require("../cloudinary")

function getToken(req) {
  const token = req?.headers?.authorization?.slice(
    7,
    req?.headers?.authorization?.length
  )

  return token
}

const getAll = async (req, res) => {
  try {
    jwt.verify(
      getToken(req),
      process.env.JWT_PRIVATE_KEY,
      async (err, { id, role }) => {
        if (role == 1) {
          let sort = db`DESC`
          if (req?.query?.sortType?.toLowerCase() === "asc") {
            sort = db`ASC`
          }
          const query = await model.getAll(sort)
          res.send({
            status: true,
            message: "Get data success",
            data: query,
          })
        } else {
          const query = await model.getById(id)
          if (!query?.length) {
            res.json({
              status: false,
              message: `ID ${id} not found!`,
            })
          }
          res.json({
            status: true,
            message: "Get success",
            data: query,
          })
        }
      }
    )
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: "Error in server",
    })
  }
}

const getById = async (req, res) => {
  try {
    jwt.verify(
      getToken(req),
      process.env.JWT_PRIVATE_KEY,
      async (err, { role }) => {
        if (role == 1) {
          const {
            params: { id },
          } = req
          if (isNaN(id)) {
            res.status(400).json({
              status: false,
              message: "ID must be integer",
            })
            return
          }
          const query = await model.getById(id)
          if (!query?.length) {
            res.json({
              status: false,
              message: `ID ${id} not found!`,
            })
          }
          res.json({
            status: true,
            message: "Get success",
            data: query,
          })
        } else {
          res.status(400).json({
            status: false,
            message: "Not authorized user!",
          })
          return
        }
      }
    )
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: "Error in server",
    })
  }
}

const create = async (req, res) => {
  try {
    const { email, fullname, phoneNumber, password } = req.body
    if (!(email && fullname && phoneNumber && password)) {
      res.status(400).json({
        status: false,
        message: "Bad input, please complete all of fields",
      })
      return
    }
    const { valid, reason, validators } = await emailValidation.isEmailValid(
      email
    )
    if (!valid) {
      res.status(400).json({
        status: false,
        message: "Email is invalid!",
        reason: validators[reason].reason,
      })
      return
    }
    const isEmailUnique = await emailValidation.isEmailUnique(email)
    if (isEmailUnique) {
      res.status(400).json({
        status: false,
        message: "Email already in use!",
      })
      return
    }
    if (fullname.length < 3) {
      res.status(400).json({
        status: false,
        message: "Fullname is invalid! Must be greater than or equal to 3",
      })
      return
    }
    if (phoneNumber.length < 11) {
      res.status(400).json({
        status: false,
        message: "Phone Number is invalid! Must be greater than or equal to 11",
      })
      return
    }
    if (password.length < 6) {
      res.status(400).json({
        status: false,
        message: "Password is invalid! Must be greater than or equal to 6",
      })
      return
    }
    let role = 2
    if (req.body.role) {
      if (isNaN(role)) {
        res.status(400).json({
          status: false,
          message: "Role is invalid! Must be integer",
        })
        return
      }
      role = req.body.role
    }
    const payload = {
      email,
      fullname,
      phoneNumber,
      password,
      role,
    }
    bcrypt.genSalt(saltRounds, function (err, salt) {
      bcrypt.hash(password, salt, async function (err, hash) {
        // Store hash in your password DB.
        const query = await model.create({ ...payload, password: hash })
        res.send({
          status: true,
          message: "Success insert data",
          data: query,
        })
      })
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: "Error in server",
    })
  }
}

const update = async (req, res) => {
  try {
    jwt.verify(
      getToken(req),
      process.env.JWT_PRIVATE_KEY,
      async (err, { id, role }) => {
        const {
          body: { email, fullname, phoneNumber, password },
        } = req
        const roleUser = req.body.role
        let checkData
        if (role == 1) {
          const idUser = req.body.id
          if (isNaN(idUser)) {
            res.status(400).json({
              status: false,
              message: "ID must be integer",
            })
            return
          }
          checkData = await model.getById(idUser)
        } else {
          checkData = await model.getById(id)
        }
        const payload = {
          email: email ?? checkData[0].email,
          fullname: fullname ?? checkData[0].fullname,
          phoneNumber: phoneNumber ?? checkData[0].phoneNumber,
          password: password ?? checkData[0].password,
          role: roleUser ?? checkData[0].role,
        }
        const { valid, reason, validators } =
          await emailValidation.isEmailValid(payload.email)
        if (!valid) {
          res.status(400).json({
            status: false,
            message: "Email is invalid!",
            reason: validators[reason].reason,
          })
          return
        }
        const isEmailUnique = await emailValidation.isEmailUnique(
          payload.email,
          checkData[0].id
        )
        if (isEmailUnique) {
          res.status(400).json({
            status: false,
            message: "Email already in use!",
          })
          return
        }
        if (payload.fullname.length < 3) {
          res.status(400).json({
            status: false,
            message: "Fullname is invalid! Must be greater than or equal to 3",
          })
          return
        }
        if (payload.phoneNumber.length < 11) {
          res.status(400).json({
            status: false,
            message:
              "Phone Number is invalid! Must be greater than or equal to 11",
          })
          return
        }
        if (payload.password.length < 6) {
          res.status(400).json({
            status: false,
            message: "Password is invalid! Must be greater than or equal to 6",
          })
          return
        }
        if (isNaN(payload.role)) {
          res.status(400).json({
            status: false,
            message: "Role is invalid! Must be integer",
          })
          return
        }
        if (password) {
          bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(password, salt, async function (err, hash) {
              payload.password = hash
              const query = await model.update(payload, checkData[0].id)
              res.send({
                status: true,
                message: "Success edit data",
                data: query,
              })
            })
          })
        } else {
          const query = await model.update(payload, checkData[0].id)
          res.send({
            status: true,
            message: "Success edit data",
            data: query,
          })
        }
      }
    )
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: "Error in server",
    })
  }
}

const updatePhoto = async (req, res) => {
  try {
    jwt.verify(
      getToken(req),
      process.env.JWT_PRIVATE_KEY,
      async (err, { id }) => {
        const { photo } = req?.files ?? {}
        if (!photo) {
          res.status(400).send({
            status: false,
            message: "Photo is required",
          })
        }
        let mimeType = photo.mimetype.split("/")[1]
        let allowFile = ["jpeg", "jpg", "png", "webp"]
        if (!allowFile?.find((item) => item === mimeType)) {
          res.status(400).send({
            status: false,
            message: "Only accept jpeg, jpg, png, webp",
          })
          return
        }
        if (photo.size > 2000000) {
          res.status(400).send({
            status: false,
            message: "File to big, max size 2MB",
          })
          return
        }
        const upload = cloudinary.uploader.upload(photo.tempFilePath, {
          public_id: new Date().toISOString(),
        })
        upload
          .then(async (data) => {
            const payload = {
              profilePicture: data?.secure_url,
            }
            await model.updatePhoto(payload, id)
            res.status(200).send({
              status: true,
              message: "Success upload",
              data: payload,
            })
          })
          .catch((err) => {
            res.status(400).send({
              status: false,
              message: err,
            })
          })
      }
    )
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: "Error on server",
    })
  }
}

const deleteUser = async (req, res) => {
  try {
    jwt.verify(
      getToken(req),
      process.env.JWT_PRIVATE_KEY,
      async (err, { id }) => {
        const checkData = await model.getById(id)
        if (!checkData?.length) {
          res.status(404).json({
            status: false,
            message: `ID ${id} not found`,
          })
          return
        }
        const query = await model.deleteUser(id)
        res.send({
          status: true,
          message: "Success delete data",
          data: query,
        })
      }
    )
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: "Error in server",
    })
  }
}

const users = [
  {
    email: "adeni@gmail.com",
    fullname: "Abubakar Adeni",
    phoneNumber: "082167895432",
    password: "pass123",
    profilePicture: null,
  },
  {
    email: "irham@gmail.com",
    fullname: "Irham Nofrianda",
    phoneNumber: "082167895432",
    password: "pass123",
    profilePicture: null,
  },
  {
    email: "isnan@gmail.com",
    fullname: "Isnan Arif Cahyadi",
    phoneNumber: "082167895432",
    password: "pass123",
    profilePicture: null,
  },
  {
    email: "rizky@gmail.com",
    fullname: "Rizki Suprayogo",
    phoneNumber: "082167895432",
    password: "pass123",
    profilePicture: null,
  },
  {
    email: "sony@gmail.com",
    fullname: "Muhammad Sony Setiawan",
    phoneNumber: "082167895432",
    password: "pass123",
    profilePicture: null,
  },
  {
    email: "naufal@gmail.com",
    fullname: "Naufal Luthfi Saputra",
    phoneNumber: "082167895432",
    password: "pass123",
    profilePicture: null,
  },
]

const seeder = async (req, res) => {
  try {
    jwt.verify(
      getToken(req),
      process.env.JWT_PRIVATE_KEY,
      async (err, { role }) => {
        if (role == 1) {
          users.forEach(async (user) => {
            const payload = {
              email: user.email,
              fullname: user.fullname,
              phoneNumber: user.phoneNumber,
              password: user.password,
              profilePicture: user.profilePicture,
            }
            await model.create(payload)
          })
          res.send({
            status: true,
            message: "Success insert data",
          })
        } else {
          res.status(400).json({
            status: false,
            message: "Not authorized user!",
          })
          return
        }
      }
    )
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: false,
      message: "Error in server",
    })
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  updatePhoto,
  deleteUser,
  seeder,
}

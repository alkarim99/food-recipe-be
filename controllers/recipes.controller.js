const isUrlValid = require("../url.validation")
const model = require("../models/recipes.models")
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
    let query
    let sort = db`DESC`
    const keyword = `%${req?.query?.keyword}%`
    const userId = req?.query?.user_id
    const isPaginate =
      req?.query?.page &&
      !isNaN(req?.query?.page) &&
      parseInt(req?.query?.page) >= 1
    if (req?.query?.sortType?.toLowerCase() === "asc") {
      if (isPaginate) {
        sort = db`ASC LIMIT 10 OFFSET ${10 * (parseInt(req?.query?.page) - 1)}`
      } else {
        sort = db`ASC LIMIT 10`
      }
    } else {
      if (isPaginate) {
        sort = db`DESC LIMIT 10 OFFSET ${10 * (parseInt(req?.query?.page) - 1)}`
      } else {
        sort = db`DESC LIMIT 10`
      }
    }
    if (req?.query?.keyword) {
      if (req?.query?.user_id) {
        query = await model.getAll(keyword, sort, userId)
      } else {
        query = await model.getAll(keyword, sort, null)
      }
    } else if (req?.query?.user_id) {
      query = await model.getAll(null, sort, userId)
    } else {
      query = await model.getAll(null, sort, null)
    }
    res.json({
      status: !!query?.length,
      message: query?.length ? "Get data success" : "Data not found",
      total: query?.length ?? 0,
      pages: isPaginate
        ? {
            current: parseInt(req?.query?.page),
            total: query?.[0]?.full_count
              ? Math.ceil(parseInt(query?.[0]?.full_count) / 10)
              : 0,
          }
        : null,
      data: query?.map((item) => {
        delete item.full_count
        return item
      }),
    })
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
      res.status(400).json({
        status: false,
        message: `ID ${id} not found!`,
      })
    }
    res.json({
      status: true,
      message: "Get success",
      data: query,
    })
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
    const { title, ingredients, videoLink, user_id } = req.body
    if (!(title && ingredients && videoLink && user_id)) {
      res.status(400).json({
        status: false,
        message: "Bad input, please complete all of fields",
      })
      return
    }
    const { recipePicture } = req?.files ?? {}
    if (!recipePicture) {
      res.status(400).send({
        status: false,
        message: "Recipe Picture is required",
      })
    }
    let mimeType = recipePicture.mimetype.split("/")[1]
    let allowFile = ["jpeg", "jpg", "png", "webp"]
    if (!allowFile?.find((item) => item === mimeType)) {
      res.status(400).send({
        status: false,
        message: "Only accept jpeg, jpg, png, webp",
      })
    }
    if (recipePicture.size > 2000000) {
      res.status(400).send({
        status: false,
        message: "File to big, max size 2MB",
      })
    }
    if (title.split(" ").length < 2) {
      res.status(400).json({
        status: false,
        message: "Title is invalid! Must be greater than or equal to 2 words",
      })
      return
    }
    if (ingredients.split(", ").length < 2) {
      res.status(400).json({
        status: false,
        message:
          "Ingredients is invalid! Must be greater than or equal to 2 ingredients. Separate with commas",
      })
      return
    }
    const checkUrlValid = isUrlValid(videoLink)
    if (!checkUrlValid) {
      res.status(400).json({
        status: false,
        message: "Video Link is invalid!",
      })
      return
    }
    const upload = cloudinary.uploader.upload(recipePicture.tempFilePath, {
      public_id: new Date().toISOString(),
    })
    upload
      .then(async (data) => {
        const payload = {
          recipePicture: data?.secure_url,
          title,
          ingredients,
          videoLink,
          user_id,
        }
        await model.create(payload)
        res.status(200).send({
          status: false,
          message: "Success insert data",
          data: payload,
        })
      })
      .catch((err) => {
        res.status(400).send({
          status: false,
          message: err,
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
          body: { title, ingredients, videoLink, user_id },
        } = req
        const idRecipe = req?.params?.id
        if (isNaN(idRecipe)) {
          res.status(400).json({
            status: false,
            message: "ID must be integer",
          })
          return
        }
        const checkData = await model.getById(idRecipe)
        if (!checkData?.length) {
          res.status(404).json({
            status: false,
            message: `ID ${idRecipe} not found`,
          })
          return
        }
        if (role != 1 && id != checkData[0].user_id) {
          res.status(400).json({
            status: false,
            message: "Not authorized user!",
          })
          return
        }
        const payload = {
          title: title ?? checkData[0].title,
          ingredients: ingredients ?? checkData[0].ingredients,
          videoLink: videoLink ?? checkData[0].videoLink,
          user_id: user_id ?? checkData[0].user_id,
        }
        if (payload.title.split(" ").length < 2) {
          res.status(400).json({
            status: false,
            message:
              "Title is invalid! Must be greater than or equal to 2 words",
          })
          return
        }
        if (payload.ingredients.split(", ").length < 2) {
          res.status(400).json({
            status: false,
            message:
              "Ingredients is invalid! Must be greater than or equal to 2 ingredients. Separate with commas",
          })
          return
        }
        const checkUrlValid = isUrlValid(payload.videoLink)
        if (!checkUrlValid) {
          res.status(400).json({
            status: false,
            message: "Video Link is invalid!",
          })
          return
        }
        const query = await model.update(payload, idRecipe)
        res.send({
          status: true,
          message: "Success edit data",
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

const updatePhoto = async (req, res) => {
  try {
    jwt.verify(
      getToken(req),
      process.env.JWT_PRIVATE_KEY,
      async (err, { id, role }) => {
        const idRecipe = req?.params?.id
        if (isNaN(idRecipe)) {
          res.status(400).json({
            status: false,
            message: "ID must be integer",
          })
          return
        }
        const checkData = await model.getById(idRecipe)
        if (role != 1 && id != checkData[0].user_id) {
          res.status(400).json({
            status: false,
            message: "Not authorized user!",
          })
          return
        }
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
        }
        if (photo.size > 2000000) {
          res.status(400).send({
            status: false,
            message: "File to big, max size 2MB",
          })
        }
        const upload = cloudinary.uploader.upload(photo.tempFilePath, {
          public_id: new Date().toISOString(),
        })
        upload
          .then(async (data) => {
            const payload = {
              recipePicture: data?.secure_url,
            }
            await model.updatePhoto(payload, idRecipe)
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
    res.status(500).send({
      status: false,
      message: "Error on server",
    })
  }
}

const deleteRecipes = async (req, res) => {
  try {
    jwt.verify(
      getToken(req),
      process.env.JWT_PRIVATE_KEY,
      async (err, { id, role }) => {
        const idRecipe = req.params.id
        if (isNaN(idRecipe)) {
          res.status(400).json({
            status: false,
            message: "ID must be integer",
          })
          return
        }
        const checkData = await model.getById(idRecipe)
        if (!checkData?.length) {
          res.status(404).json({
            status: false,
            message: `ID ${idRecipe} not found`,
          })
          return
        }
        if (role != 1 && id != checkData[0].user_id) {
          res.status(400).json({
            status: false,
            message: "Not authorized user!",
          })
          return
        }
        const query = await model.deleteRecipe(idRecipe)
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

const recipes = [
  {
    recipePicture:
      "https://www.masakapahariini.com/wp-content/uploads/2020/04/Nasi-Goreng-Sederhana-780x440.jpg",
    title: "Resep Nasi Goreng Sederhana",
    ingredients:
      "Nasi putih, Wortel, Bawang putih, Bawang merah, Cabai merah, Kecap manis, Kaldu ayam, Daun bawang, Minyak goreng",
    videoLink: "https://youtu.be/BQZEiWAZyKM",
    userId: 1,
  },
  {
    recipePicture:
      "https://www.masakapahariini.com/wp-content/uploads/2018/04/cara-membuat-mie-goreng-telur-780x440.jpg",
    title: "Resep Mie Goreng Ala Restoran",
    ingredients:
      "Mie telor, Taouge, Sawi, Ayam kampung, Bawang putih, Bawang merah, Cabai rawit, Garam, Merica putih bubuk, Gula pasir, Kecap manis, Minyak sayur, Timun, Bawang goreng",
    videoLink: "https://youtu.be/46CsR1Ma0EA",
    userId: 2,
  },
  {
    recipePicture:
      "https://www.masakapahariini.com/wp-content/uploads/2018/11/tahu-telur-MAHI-1-780x440.jpg",
    title: "Resep Tahu Telor Surabaya",
    ingredients:
      "Tahu putih, Telor ayam, Kaldu ayam, Merica putih bubuk, Kol, Taoge, Minyak goreng, Cabe rawit merah, Bawang putih, Kacang tanah goreng, Air hangat, Air jeruk nipis, Kecap manis, Bawang goreng, Seledri",
    videoLink: "https://youtu.be/B77Pf_PGl_Q",
    userId: 3,
  },
  {
    recipePicture:
      "https://www.masakapahariini.com/wp-content/uploads/2018/10/ayam-rendang-MAHI-4-780x440.jpg",
    title: "Resep Rendang Ayam Rumahan",
    ingredients:
      "Ayam, Air matang, Santan, Royco bumbu rendang, Kacang merah, Minyak sayur, Bawang putih, Bawang merah, Jahe, Cabai merah, Cabai rawit merah",
    videoLink: "https://youtu.be/GS4i96HVzKw",
    userId: 4,
  },
  {
    recipePicture:
      "https://www.masakapahariini.com/wp-content/uploads/2018/04/ayam-goreng-mentega-e1681288291125-780x440.jpg",
    title: "Resep Rendang Ayam Rumahan",
    ingredients:
      "Ayam, Bawang putih, Merica butiran, Garam, Kecap manis, Mentega, Bawang bombay, Kecap inggris, Kecap asin, Air jeruk nipis",
    videoLink: "https://youtu.be/TBq8A-jYKd4",
    userId: 5,
  },
  {
    recipePicture:
      "https://www.masakapahariini.com/wp-content/uploads/2023/03/shutterstock_1949306203-780x440.jpg",
    title: "Resep Ayam Geprek Sambal Bawang",
    ingredients:
      "Ayam, Tepung maizena, Telor ayam, Royco kaldu ayam, Ketumbar bubuk, Garam, Merica putih bubuk, Tepung terigu, Tepung Beras, Baking powder, Cabai rawit merah, Bawang merah, Bawang putih, Minyak",
    videoLink: "https://youtu.be/cuFQ0kFQfgs",
    userId: 6,
  },
]

const seeder = async (req, res) => {
  try {
    for (let index = 0; index < 2; index++) {
      recipes.forEach(async (recipe) => {
        const payload = {
          recipePicture: recipe.recipePicture,
          title: recipe.title,
          ingredients: recipe.ingredients,
          videoLink: recipe.videoLink,
          user_id: recipe.userId,
        }
        await model.create(payload)
      })
    }
    res.send({
      status: true,
      message: "Success insert data",
    })
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
  deleteRecipes,
  seeder,
}

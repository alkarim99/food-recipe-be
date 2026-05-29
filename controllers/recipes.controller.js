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
    return res.status(500).send({
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
      return res.status(400).json({
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
    return res.status(500).send({
      status: false,
      message: "Error in server",
    })
  }
}

const getByCategory = async (req, res) => {
  try {
    const {
      params: { category },
    } = req
    if (!category) {
      res.status(400).json({
        status: false,
        message: "Please fill the category!",
      })
      return
    }
    const query = await model.getByCategory(category)
    if (!query?.length) {
      return res.status(200).json({
        status: false,
        message: `Recipes for category ${category} is not found!`,
      })
    }
    res.json({
      status: true,
      message: "Get success",
      data: query,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      status: false,
      message: "Error in server",
    })
  }
}

const create = async (req, res) => {
  try {
    const { title, ingredients, video_link, user_id, category } = req.body
    if (!(title && ingredients && video_link && user_id && category)) {
      res.status(400).json({
        status: false,
        message: "Bad input, please complete all of fields",
      })
      return
    }
    const { recipe_picture } = req?.files ?? {}
    if (!recipe_picture) {
      return res.status(400).send({
        status: false,
        message: "Recipe Picture is required",
      })
    }
    let mimeType = recipe_picture.mimetype.split("/")[1]
    let allowFile = ["jpeg", "jpg", "png", "webp"]
    if (!allowFile?.find((item) => item === mimeType)) {
      return res.status(400).send({
        status: false,
        message: "Only accept jpeg, jpg, png, webp",
      })
    }
    if (recipe_picture.size > 2000000) {
      return res.status(400).send({
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
    const checkUrlValid = isUrlValid(video_link)
    if (!checkUrlValid) {
      res.status(400).json({
        status: false,
        message: "Video Link is invalid!",
      })
      return
    }
    const upload = cloudinary.uploader.upload(recipe_picture.tempFilePath, {
      public_id: new Date().toISOString(),
    })
    upload
      .then(async (data) => {
        const payload = {
          recipe_picture: data?.secure_url,
          title,
          ingredients,
          video_link,
          user_id,
          category,
        }
        await model.create(payload)
        return res.status(200).send({
          status: true,
          message: "Success insert data",
          data: payload,
        })
      })
      .catch((err) => {
        return res.status(400).send({
          status: false,
          message: err,
        })
      })
  } catch (error) {
    console.log(error)
    return res.status(500).send({
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
          body: { title, ingredients, video_link, user_id, category },
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
          video_link: video_link ?? checkData[0].video_link,
          user_id: user_id ?? checkData[0].user_id,
          category: category ?? checkData[0].category,
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
        const checkUrlValid = isUrlValid(payload.video_link)
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
    return res.status(500).send({
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
          return
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
              recipe_picture: data?.secure_url,
            }
            await model.updatePhoto(payload, idRecipe)
            return res.status(200).send({
              status: true,
              message: "Success upload",
              data: payload,
            })
          })
          .catch((err) => {
            return res.status(400).send({
              status: false,
              message: err,
            })
          })
      }
    )
  } catch (error) {
    return res.status(500).send({
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
    return res.status(500).send({
      status: false,
      message: "Error in server",
    })
  }
}

const recipes = [
  {
    recipe_picture:
      "https://res.cloudinary.com/drqodwhwd/image/upload/v1780016486/nasi-goreng-sederhana_wznxgj.avif",
    title: "Resep Nasi Goreng Sederhana",
    ingredients:
      "Nasi putih, Wortel, Bawang putih, Bawang merah, Cabai merah, Kecap manis, Kaldu ayam, Daun bawang, Minyak goreng",
    video_link: "https://youtu.be/BQZEiWAZyKM",
    userId: 1,
    category: "lunch",
  },
  {
    recipe_picture:
      "https://res.cloudinary.com/drqodwhwd/image/upload/v1780016486/mie-goreng-restoran_xjdars.jpg",
    title: "Resep Mie Goreng Ala Restoran",
    ingredients:
      "Mie telor, Taouge, Sawi, Ayam kampung, Bawang putih, Bawang merah, Cabai rawit, Garam, Merica putih bubuk, Gula pasir, Kecap manis, Minyak sayur, Timun, Bawang goreng",
    video_link: "https://youtu.be/46CsR1Ma0EA",
    userId: 1,
    category: "lunch",
  },
  {
    recipe_picture:
      "https://res.cloudinary.com/drqodwhwd/image/upload/v1780016486/tahu-telor-sby_y3yozz.avif",
    title: "Resep Tahu Telor Surabaya",
    ingredients:
      "Tahu putih, Telor ayam, Kaldu ayam, Merica putih bubuk, Kol, Taoge, Minyak goreng, Cabe rawit merah, Bawang putih, Kacang tanah goreng, Air hangat, Air jeruk nipis, Kecap manis, Bawang goreng, Seledri",
    video_link: "https://youtu.be/B77Pf_PGl_Q",
    userId: 1,
    category: "snack",
  },
  {
    recipe_picture:
      "https://res.cloudinary.com/drqodwhwd/image/upload/v1780016487/rendang-ayam_mxwt1j.webp",
    title: "Resep Rendang Ayam Rumahan",
    ingredients:
      "Ayam, Air matang, Santan, Royco bumbu rendang, Kacang merah, Minyak sayur, Bawang putih, Bawang merah, Jahe, Cabai merah, Cabai rawit merah",
    video_link: "https://youtu.be/GS4i96HVzKw",
    userId: 1,
    category: "dinner",
  },
  {
    recipe_picture:
      "https://res.cloudinary.com/drqodwhwd/image/upload/v1780016486/ayam-goreng-mentega_ik949u.webp",
    title: "Resep Ayam Goreng Mentega",
    ingredients:
      "Ayam, Bawang putih, Merica butiran, Garam, Kecap manis, Mentega, Bawang bombay, Kecap inggris, Kecap asin, Air jeruk nipis",
    video_link: "https://youtu.be/TBq8A-jYKd4",
    userId: 1,
    category: "dinner",
  },
  {
    recipe_picture:
      "https://res.cloudinary.com/drqodwhwd/image/upload/v1780016486/ayam-geprek_rm5pxa.avif",
    title: "Resep Ayam Geprek Sambal Bawang",
    ingredients:
      "Ayam, Tepung maizena, Telor ayam, Royco kaldu ayam, Ketumbar bubuk, Garam, Merica putih bubuk, Tepung terigu, Tepung Beras, Baking powder, Cabai rawit merah, Bawang merah, Bawang putih, Minyak",
    video_link: "https://youtu.be/cuFQ0kFQfgs",
    userId: 1,
    category: "lunch",
  },
]

const seeder = async (req, res) => {
  try {
    jwt.verify(
      getToken(req),
      process.env.JWT_PRIVATE_KEY,
      async (err, { role }) => {
        if (role == 1) {
          for (const recipe of recipes) {
            try {
              const payload = {
                recipe_picture: recipe.recipe_picture,
                title: recipe.title,
                ingredients: recipe.ingredients,
                video_link: recipe.video_link,
                user_id: recipe.userId,
                category: recipe.category,
              };
              const result = await model.create(payload);
              if (result instanceof Error) {
                console.log("ERROR INSERT:", result);
              }
            } catch (err) {
              console.log("ERROR INSERT:", err);
            }
          }
          res.send({
            status: true,
            message: "Success insert data",
          });
        } else {
          res.status(400).json({
            status: false,
            message: "Not authorized user!",
          });
          return;
        }
      },
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: false,
      message: "Error in server",
    });
  }
}

module.exports = {
  getAll,
  getById,
  getByCategory,
  create,
  update,
  updatePhoto,
  deleteRecipes,
  seeder,
}

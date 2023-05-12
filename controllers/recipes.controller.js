const isUrlValid = require('../isUrlValid')
const model = require('../models/recipes.models')
const db = require('../database')

const getAll = async (req, res) => {
  try {
    let query
    let sort = db`DESC`
    const keyword = `%${req?.query?.keyword}%`
    const isPaginate =
      req?.query?.page &&
      !isNaN(req?.query?.page) &&
      parseInt(req?.query?.page) >= 1
    if (req?.query?.sortType?.toLowerCase() === 'asc') {
      if (isPaginate) {
        sort = db`ASC LIMIT 10 OFFSET ${10 * (parseInt(req?.query?.page) - 1)}`
      } else {
        sort = db`ASC LIMIT 10`
      }
    } else {
      if (isPaginate) {
        sort = db`DESC LIMIT 10 OFFSET ${
          10 * (parseInt(req?.query?.page) - 1)
        }`
      } else {
        sort = db`DESC LIMIT 10`
      }
    }
    if (req?.query?.keyword) {
      query = await model.getAll(keyword, sort)
    } else {
      query = await model.getAll(null, sort)
    }
    res.json({
      status: !!query?.length,
      message: query?.length ? 'Get data success' : 'Data not found',
      total: query?.length ?? 0,
      pages: isPaginate
        ? {
            current: parseInt(req?.query?.page),
            total: query?.[0]?.full_count
              ? Math.ceil(parseInt(query?.[0]?.full_count) / 10)
              : 0
          }
        : null,
      data: query?.map((item) => {
        delete item.full_count
        return item
      })
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
    const { recipePicture, title, ingredients, videoLink } = req.body
    if (!(recipePicture && title && ingredients && videoLink)) {
      res.status(400).json({
        status: false,
        message: 'Bad input, please complete all of fields'
      })
      return
    }
    if (title.split(' ').length < 2) {
      res.status(400).json({
        status: false,
        message: 'Title is invalid! Must be greater than or equal to 2 words'
      })
      return
    }
    if (ingredients.split(', ').length < 2) {
      res.status(400).json({
        status: false,
        message:
          'Ingredients is invalid! Must be greater than or equal to 2 ingredients. Separate with commas'
      })
      return
    }
    const checkUrlValid = isUrlValid(videoLink)
    if (!checkUrlValid) {
      res.status(400).json({
        status: false,
        message: 'Video Link is invalid!'
      })
      return
    }
    const payload = {
      recipePicture,
      title,
      ingredients,
      videoLink
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
      body: { recipePicture, title, ingredients, videoLink }
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
      recipePicture: recipePicture ?? checkData[0].recipePicture,
      title: title ?? checkData[0].title,
      ingredients: ingredients ?? checkData[0].ingredients,
      videoLink: videoLink ?? checkData[0].videoLink
    }
    if (payload.title.split(' ').length < 2) {
      res.status(400).json({
        status: false,
        message: 'Title is invalid! Must be greater than or equal to 2 words'
      })
      return
    }
    if (payload.ingredients.split(', ').length < 2) {
      res.status(400).json({
        status: false,
        message:
          'Ingredients is invalid! Must be greater than or equal to 2 ingredients. Separate with commas'
      })
      return
    }
    const checkUrlValid = isUrlValid(payload.videoLink)
    if (!checkUrlValid) {
      res.status(400).json({
        status: false,
        message: 'Video Link is invalid!'
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

const deleteRecipes = async (req, res) => {
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
    const checkData = await model.getById(id)
    if (!checkData?.length) {
      res.status(404).json({
        status: false,
        message: `ID ${id} not found`
      })
      return
    }
    const query = await model.deleteRecipe(id)
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

const recipe = {
  recipePicture:
    'https://www.masakapahariini.com/wp-content/uploads/2020/04/Nasi-Goreng-Sederhana-780x440.jpg',
  title: 'Resep Nasi Goreng Sederhana',
  ingredients:
    'Nasi putih, Wortel, Bawang putih, Bawang merah, Cabai merah, Kecap manis, Kaldu ayam, Daun bawang, Minyak goreng',
  videoLink: 'https://youtu.be/BQZEiWAZyKM'
}

const seeder = async (req, res) => {
  try {
    const payload = {
      recipePicture: recipe.recipePicture,
      title: recipe.title,
      ingredients: recipe.ingredients,
      videoLink: recipe.videoLink
    }
    for (let index = 0; index < 2; index++) {
      await model.create(payload)
    }
    res.send({
      status: true,
      message: 'Success insert data'
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
  deleteRecipes,
  seeder
}

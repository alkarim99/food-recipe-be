const router = require('express').Router()
const recipesController = require('../controllers/recipes.controller')

router.get('/recipes/:id', recipesController.getById)
router.get('/recipes', recipesController.getAll)
router.post('/recipes', recipesController.create)
router.patch('/recipes/:id', recipesController.update)
router.delete('/recipes/:id', recipesController.deleteRecipes)
router.post('/recipes/seeder', recipesController.seeder)

module.exports = router

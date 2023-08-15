const router = require("express").Router()
const recipesController = require("../controllers/recipes.controller")
const middleware = require("../middleware/jwt.middleware")

router.get("/recipes/:id", recipesController.getById)
router.get("/recipes", recipesController.getAll)
router.get("/recipes/category/:category", recipesController.getByCategory)
router.post("/recipes", middleware, recipesController.create)
router.patch("/recipes/photo/:id", middleware, recipesController.updatePhoto)
router.patch("/recipes/:id", middleware, recipesController.update)
router.delete("/recipes/:id", middleware, recipesController.deleteRecipes)
router.post("/recipes/seeder", middleware, recipesController.seeder)

module.exports = router

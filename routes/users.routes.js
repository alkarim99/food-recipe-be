const router = require("express").Router()
const usersController = require("../controllers/users.controller")
const middleware = require("../middleware/jwt.middleware")

router.get("/users/:id", middleware, usersController.getById)
router.get("/users", middleware, usersController.getAll)
router.post("/users", usersController.create)
router.patch("/users", middleware, usersController.update)
router.patch("/users/photo", middleware, usersController.updatePhoto)
router.delete("/users", middleware, usersController.deleteUser)
router.post("/users/seeder", middleware, usersController.seeder)

module.exports = router

const router = require('express').Router()
const usersController = require('../controllers/users.controller')

router.get('/users/:id', usersController.getById)
router.get('/users', usersController.getAll)
router.post('/users', usersController.create)
router.patch('/users/:id', usersController.update)
router.delete('/users/:id', usersController.deleteUser)

module.exports = router

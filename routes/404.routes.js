const invalidEndPoint = require('../controllers/404.controller')
const router = require('express').Router()

router.get('*', invalidEndPoint)
router.post('*', invalidEndPoint)
router.patch('*', invalidEndPoint)
router.delete('*', invalidEndPoint)

module.exports = router

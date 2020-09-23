const express = require('express')

const router = express.Router()

const controller = require('../controllers/data')

router.get('/province',controller.getProvince)

router.get('/citta/:sigla',controller.getCitta)

module.exports = router;
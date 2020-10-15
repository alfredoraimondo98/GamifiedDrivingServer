const express = require('express');
const router = express.Router();

const sessioneController = require('../controllers/sessione');
const isAuth = require('../middleware/is-auth');

router.post('/getPosizione', sessioneController.getPosizione);


module.exports = router;
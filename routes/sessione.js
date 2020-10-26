const express = require('express');
const { session } = require('passport');
const router = express.Router();

const sessioneController = require('../controllers/sessione');
const isAuth = require('../middleware/is-auth');

router.post('/startSession',sessioneController.startSession);
router.post('/updateSession', sessioneController.updateSession);
router.post('/ensSession', sessioneController.endSession);
router.post('/getPosizione', sessioneController.getPosizione);


module.exports = router;
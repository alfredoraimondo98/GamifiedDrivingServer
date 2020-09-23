const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const authController = require('../controllers/auth');


router.get('/login', [], authController.getUtenti);
router.post('/register', [], authController.insertUtente);
 
module.exports = router;
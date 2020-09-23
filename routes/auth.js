const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const authController = require('../controllers/auth');



router.post('/register', [
    body('password').trim().isLength({ min : 5}).withMessage('Inserire una password valida (almeno 8 caratteri')

], authController.createUtente);
 

router.post('/login', authController.loginApp);


module.exports = router;
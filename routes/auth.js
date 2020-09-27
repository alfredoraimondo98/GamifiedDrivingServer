const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy
const FB = require('fb');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

router.post('/register', [
    //body('password').trim().isLength({ min : 5}).withMessage('Inserire una password valida (almeno 8 caratteri')

], authController.createUtente);
 

router.post('/login', authController.loginApp);

router.get('/facebook',  authController.loginFb);


module.exports = router;
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
router.get('/login/me', isAuth, authController.loginMe);

router.get('/facebook',  passport.authenticate("facebook"));
router.get('/facebook/callback', passport.authenticate('facebook', { successRedirect: '/auth/successLoginFacebook', failureRedirect: '/auth/errorLogin' }));
router.get('/successLoginFacebook', authController.successFb);
router.post('/errorLogin', authController.errorFb);


module.exports = router;
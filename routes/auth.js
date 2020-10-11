const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy
const FB = require('fb');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');



/* const cors = require('cors');
const allowedOrigins = [
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'http://localhost:8100'
  ];

// Reflect the origin if it's in the allowed list or not defined (cURL, Postman, etc.)
const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    }
  }
  
 // Enable preflight requests for all routes
router.options('*', cors(corsOptions));

 */
router.post('/register', [
    //body('password').trim().isLength({ min : 5}).withMessage('Inserire una password valida (almeno 8 caratteri')

], authController.createUtente);
 

router.post('/login', authController.loginApp);
router.get('/login/me', isAuth, authController.loginMe);
router.post('/checkEmail', authController.checkEmail);

router.get('/facebook', passport.authenticate("facebook"));
router.get('/facebook/callback', passport.authenticate('facebook', { successRedirect: '/auth/successLoginFacebook', failureRedirect: '/auth/errorLogin' }));
router.get('/successLoginFacebook', authController.successFb);
router.post('/errorLogin', authController.errorFb);




module.exports = router;
const express = require('express');
const router = express.Router();

const profiloController = require('../controllers/profilo');
const isAuth = require('../middleware/is-auth');

router.post('/getProfilo', profiloController.getProfilo);

router.post('/garage/getGarage', profiloController.getGarage);
router.post('/garage/setAutoPredefinita', profiloController.setAutoPredefinita);

router.get('/classifica/getClassificaGlobale', profiloController.getClassificaGlobale);
router.post('/classifica/getClassificaLocale', profiloController.getClassificaLocale);
router.post('/classifica/getClassificaFacebook', profiloController.getClassificaFacebook);

router.post('/avatar/getAvatar', profiloController.getAvatar);
router.get('/avatar/getAllAvatar', profiloController.getAllAvatar);
router.post('/avatar/setAvatarPredefinito', profiloController.setAvatarPredefinito);



module.exports = router;
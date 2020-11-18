const express = require('express');
const router = express.Router();

const drivepassController = require('../controllers/drivepass');
const isAuth = require('../middleware/is-auth');

router.post('/getDrivepass', drivepassController.getDrivepass);
router.post('/getCurrentLevel', drivepassController.getCurrentLevel);

router.post('/verificaRiscatto', drivepassController.verificaRiscatto);
router.post('/riscattaLivello', drivepassController.riscattaLivello);

module.exports = router;
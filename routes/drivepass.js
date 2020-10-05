const express = require('express');
const router = express.Router();

const drivepassController = require('../controllers/drivepass');
const isAuth = require('../middleware/is-auth');

router.post('/getDrivepass', drivepassController.getDrivepass);




module.exports = router;
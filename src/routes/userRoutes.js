const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Define routes
router.get('/', userController.GetSubscriberdues);
router.get('/:id', userController.GetChitDetails);

module.exports = router;

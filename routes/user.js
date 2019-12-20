const express = require('express');
const router = express.Router();
const controller = require('../controller/user');
const auth = require('../auth/strategy');


router.get('/', auth.isAuthenticated, controller.me);
router.post('/', controller.create);
router.post('/pokemon/:id', auth.isAuthenticated, controller.addPokemon)
router.delete('/pokemon/:id', auth.isAuthenticated, controller.removePokemon)

module.exports = router;

const User = require('../models/user');
const router = require('express').Router();
const config = require('../config');
const passport = require('passport');
const { returnMongooseResponseOrError } = require('../controller/_helper');

router.post('/', function(req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        var error = err || info;
        if (error) return res.status(401).json(Object.assign({loginFailed: true}, error));
        if (!user) return res.status(404).json({message: 'Something went wrong, please try again.'});

        req.logIn(user, (err) => {
            if(err) next(err);
            User.findOne({_id: user._id}, User.exceptFields).lean().exec(returnMongooseResponseOrError(res));
        });

    })(req, res, next)
});

router.get('/github', passport.authenticate('github', { scope: [ 'user:email' ] }), function(req, res) {})
router.get('/github/callback', passport.authenticate('github', { failureRedirect: `${process.env.APP_URL}/login?error=true` }), function(req, res) {
    res.redirect(`${process.env.APP_URL}`)
})

router.get('/logout', function(req, res){
    req.logout();
    req.session.destroy();
    console.log('logout');
    res.send('ok');
});

module.exports = router;

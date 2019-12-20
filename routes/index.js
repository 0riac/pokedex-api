module.exports = app => {
    app.use(function (req, res, next) {
        res.header("Content-Type",'application/json');
        next();
    });

    app.use('/auth', require('../auth'));
    app.use('/user', require('./user'));
};

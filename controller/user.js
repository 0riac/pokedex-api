const User = require('../models/user');
const { returnMongooseResponseOrError } = require('./_helper');
const validator = require('validator');
const passport = require('passport');

exports.me = function(req, res) {
    User.findOne({_id: req.user._id}, User.exceptFields).lean().exec(returnMongooseResponseOrError(res));
};

exports.get = function(req, res) {
    User.findOne({...req.query}, User.exceptFields).lean().exec(returnMongooseResponseOrError(res));
};

exports.create = async function(req, res, next) {
    try {
        let validationErrors = [];
        if (!validator.isEmail(req.body.email)) validationErrors.push({
            type: 'ValidationError',
            message: 'Please enter a valid email address.'
        });
        if (!validator.isAlphanumeric(req.body.password)) validationErrors.push({
            type: 'ValidationError',
            message: 'Password must consist of latin letters and numbers only'
        });
        if (!validator.isLength(req.body.password, { min: 8 })) validationErrors.push({
            type: 'ValidationError',
            message: 'Password must be at least 8 characters long'
        });
        if (validationErrors.length) {
            validationErrors = validationErrors.length > 1 ? validationErrors : validationErrors[0];
            console.log(validationErrors);
            return res.status(400).send(JSON.stringify(validationErrors));
        }
        req.body.email = validator.normalizeEmail(req.body.email, { gmail_remove_dots: false });

        const user = new User({
            email: req.body.email,
            password: req.body.password,
            firstName: req.body.firstName || '',
            lastName: req.body.lastName || '',
        });

        const data = await user.save();
        req.user = data;

        passport.authenticate('local', function(err, user, info) {
            const error = err || info;

            if (error) return res.status(401).json(Object.assign({ loginFailed: true }, error));
            if (!user) return res.status(404).json({ message: 'Something went wrong, please try again.' });

            req.logIn(user, (err) => {
                if (err) next(err);
                User.findOne({ _id: user._id }, User.exceptFields).lean().exec(returnMongooseResponseOrError(res));
            });

        })(req, res, next)
    } catch (err) {
        next(err);
    }
};

exports.addPokemon = async function(req, res, next) {
    const { id } = req.params;
    try {
        const user = await User.findOne({ _id: req.user._id }).exec();
        const pokemons = new Set([...user.pokemons]);
        pokemons.add(id);

        User.findOneAndUpdate({ _id: user._id }, { pokemons: [...pokemons] }, { new: true }).select(User.exceptFields).lean().exec(returnMongooseResponseOrError(res));
    } catch(err) {
        next(err);
    }
};

exports.removePokemon = async function(req, res, next) {
    const { id } = req.params;
    try {
        const user = await User.findOne({ _id: req.user._id }).exec();
        const pokemons = new Set([...user.pokemons]);
        pokemons.delete(id);

        User.findOneAndUpdate({ _id: user._id }, { pokemons: [...pokemons] }, { new: true }).select(User.exceptFields).lean().exec(returnMongooseResponseOrError(res));
    } catch(err) {
        next(err);
    }
};

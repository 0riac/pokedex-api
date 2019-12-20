const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy
const User = require('../models/user');

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, done) {
        User.findOne({
            email: email
        }, function(err, user) {
            if (err) return done(err);
            if (!user) {
                return done(null, false);
            }
            if (!user.authenticate(password)) {
                return done(null, false)
            }
            return done(null, user);
        });
    }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/github/callback`,
    passReqToCallback: true,
    scope: ['user:email']
}, async (req, accessToken, refreshToken, profile, done) => {
    console.log(profile);
    try {
        const userByGithubId = await User.findOne({ github: profile.id });
        if(userByGithubId) {
            done(null, userByGithubId);
        } else {
            const email = profile._json.email || profile.emails[0].value;
            const userByEmail = await User.findOne({ email });
            if(userByEmail) {
                done(null);
            } else {
                const user = new User();
                user.github = profile.id;
                user.firstName = profile._json.name || profile.username;
                user.email = email;
                user.save((err) => {
                    done(err, user)
                })
            }
        }
    } catch {}
}));

exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).send('Not authorized');
};

const mongoose = require('mongoose');
const autoincrement = require('simple-mongoose-autoincrement');
const crypto = require('crypto');
const validator = require('validator');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: 'An email required',
        validate: {
            isAsync: true,
            validator: function(value, respond) {
                this.constructor.findOne({email: value}, (err, user) => {
                    if(err) throw new Error(err);
                    respond(!user || this._id === user._id);
                });
            },
            message: 'This mail is already registered'
        }
    },
    firstName: {type: String, default: ''},
    lastName: {type: String, default: ''},

    pokemons: { type: Array, default: [] },

    userId: Number,

    github: String,

    hashedPassword: String,
    salt: String,

    createdAt:  { type: Date, default: Date.now },

}, { usePushEach: true });

UserSchema.index({ userId: 1});
UserSchema.plugin(autoincrement, {field: 'userId'});

UserSchema.statics.exceptFieldsArray = ['salt', 'hashedPassword'];
UserSchema.statics.removeBannedFields = data => UserSchema.statics.exceptFieldsArray.forEach(x => { data[x] = undefined; });
UserSchema.statics.exceptFields = UserSchema.statics.exceptFieldsArray.map(x => '-' + x).join(' ');

UserSchema
    .virtual('password')
    .set(function(password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() {
        return this._password;
    });

UserSchema
    .path('hashedPassword')
    .validate(hashedPassword => hashedPassword.length, 'Password required');

UserSchema
    .path('email')
    .validate(validator.isEmail, 'Email not valid');

UserSchema.methods = {
    authenticate: function(plainText) {
        return this.encryptPassword(plainText) === this.hashedPassword;
    },

    makeSalt: function() {
        return crypto.randomBytes(16).toString('base64');
    },

    encryptPassword: function(password) {
        if (!password || !this.salt) return '';
        var salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('base64');
    },

    removeBannedFields(user) {
        return UserSchema.statics.exceptFieldsArray.forEach(x => { user[x] = undefined; });
    }
};

module.exports = mongoose.model('User', UserSchema);

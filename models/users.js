let mongoose = require('mongoose')
let uniqueValidator = require('mongoose-unique-validator');
let bcrypt = require('bcrypt')
let validator = require('validator')

let timestampPlugin = require('./plugins/timestamp')


const SALT_WORK_FACTOR = 14;

let usersSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: value => validator.isEmail(value),
      message: 'Please enter a valid email address',
      isAsync: false
    }
  },
  mobilePhone: {
    type: String,
    required: [true, 'Mobile Number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(value) {
        return /[6-9]{1}[0-9]{9}/.test(value);
      },
      message: props => `${props.value} is not a valid Indian mobile number!`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be atleast 6 characters long'],
    maxLength: [72, 'Password cannot be more than 72 characters long']
  },
  aadhaarNumber: {
    type: String,
    required: [true, 'Aadhaar Number is required'],
    unique: true,
    trim: true,
    minLength: [12, 'Please enter valid 12 digit Aadhaar Number'],
    maxLength: [12, 'Please enter valid 12 digit Aadhar Number']
  },
  aadhaarFileLink: {
    type: String,
    required: [true, 'Aadhar Card file is required'],
    unique: true,
  }
});

// virtual properties are not added to the model
usersSchema.virtual('fullName').get(function() {
  return this.firstName + ' ' + this.lastName
});

usersSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

usersSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) return cb(err);
      cb(null, isMatch);
  });
};

/**
 * Add the timestamp plugin which
 * has the createdAt and updatedAt fields
 */
usersSchema.plugin(timestampPlugin);
/**
 * Add the uniqueValidator plugin
 * to ensure that unique fields raise
 * a Mongoose validationError for duplicate
 * values
 */
usersSchema.plugin(uniqueValidator, { message: 'Error, this value already exists in the database!' });

/**
 * Expose the usersSchema
 */
var User = mongoose.model('User', usersSchema);
module.exports = User;
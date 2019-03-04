let mongoose = require('mongoose')
let uniqueValidator = require('mongoose-unique-validator');

let timestampPlugin = require('./plugins/timestamp')

let landsSchema = new mongoose.Schema({
    owner: {
        type: String,
        required: [true, 'Owner is required']
    },
    plotNumber: {
        type: String,
        required: [true, 'Plot Number is required']
    },
    streetName: {
        type: String,
        required: [true, 'Street name is required']
    },
    locality: {
        type: String,
        required: [true, 'Locality is required']
    },
    cityName: {
        type: String,
        required: [true, 'City is required']
    },
    state: {
        type: String,
        required: [true, 'State is required']
    },
    deedFileLink: {
        type: String,
        required: [true, 'Title deed file is required'],
        unique: true,
    },
    imageFileLink: {
        type: String,
        required: [true, 'Image of property is required'],
        unique: true,
    }
});

/**
 * Add the timestamp plugin which
 * has the createdAt and updatedAt fields
 */
landsSchema.plugin(timestampPlugin);
/**
 * Add the uniqueValidator plugin
 * to ensure that unique fields raise
 * a Mongoose validationError for duplicate
 * values
 */
landsSchema.plugin(uniqueValidator, { message: 'Error, this value already exists in the database!' });

/**
 * Expose the usersSchema
 */
var Land = mongoose.model('Land', landsSchema);
module.exports = Land;
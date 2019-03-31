let mongoose = require('mongoose')

let timestampPlugin = require('./plugins/timestamp')

let fingerprintSchema = new mongoose.Schema({
    sellerAadhaar: {
        type: String,
        required: [true, 'Aadhaar No. is required']
    },
    landId: {
        type: mongoose.Schema.ObjectId,
        required: [true, "Land Id is required"]
    },
    fingerprintValidated: {
        type: Boolean,
        default: false
    }
});

fingerprintSchema.plugin(timestampPlugin);

var Fingerprint = mongoose.model('Fingerprint', fingerprintSchema);
module.exports = Fingerprint;
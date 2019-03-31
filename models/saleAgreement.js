let mongoose = require('mongoose')
let timestampPlugin = require('./plugins/timestamp')

let saleAgreementSchema = mongoose.Schema({
    buyer: {
        type: String,
        required: [true, 'Buyer is required']
    },
    seller: {
        type: String,
        required: [true, 'Seller is required']
    },
    land: {
        type: String,
        required: [true, 'Land title is required']
    },
    landImage: {
        type: String,
        required: [true, 'Land image required']
    },
    landText: {
        type: String,
        required: [true, 'Land text required']
    } //,
    // sellerFingerprintVerify: {
    //     type: boolean,
    //     default: false
    // }
});

/**
 * Add the timestamp plugin which
 * has the createdAt and updatedAt fields
 */
saleAgreementSchema.plugin(timestampPlugin);

/**
 * Expose the usersSchema
 */
var saleAgreement = mongoose.model('SaleAgreement', saleAgreementSchema);
module.exports = saleAgreement;
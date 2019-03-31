var express = require('express');
var multer = require('multer')
var crypto = require('crypto')
var path = require('path')
var bcrypt = require('bcrypt')

const storage = multer.diskStorage({
    destination: 'public/images/uploads/users/Aadhaar',
    filename: function(req, file, callback) {
        crypto.pseudoRandomBytes(16, function(err, raw) {
            if (err) {
                return callback(err);
            }
            callback(null, raw.toString('hex') + path.extname(file.originalname));
        });
    }
});

const LandImageStorage = multer.diskStorage({
    destination: 'public/images/uploads/lands',
    filename: function(req, file, callback) {
        crypto.pseudoRandomBytes(16, function(err, raw) {
            if (err) {
                return callback(err);
            }
            callback(null, raw.toString('hex') + path.extname(file.originalname));
        });
    }
})

var upload = multer({ storage: storage });
var landImageUpload = multer({ storage: LandImageStorage })
var router = express.Router();

let User = require('../models/users')
let Land = require('../models/lands')
let Fingerprint = require('../models/fingerprints')
let SaleAgreement = require('../models/saleAgreement')
const { connect } = require('../config/connect');

/* POST for user dashboard after login */
router.post('/dashboard', function(req, res, next) {
    var userId = req.cookies.userID;
    let mLands, mUser;
    /*Land.find({ owner: userId }, function(err, lands) {
        if (err) {
            console.log(err);
            res.render('error', { message: err });
        } else {
            if (lands == null) {
                res.render('user_dashboard', { lands: [] });
            } else {
                res.render('user_dashboard', { lands: lands });
            }
        }
    });*/
    Land.find({ owner: userId }).then(land => {
        mLands = land;
        return User.findOne({ _id: userId });
    }).then(currUser => {
        if (currUser == null) {
            res.render('error', { message: "UserId not found in /dashboard" });
        } else {
            if (mLands == null) {
                res.render('user_dashboard', { lands: [], userAadhaar: currUser.aadhaarNumber });
            } else {
                res.render('user_dashboard', { lands: mLands, userAadhaar: currUser.aadhaarNumber });
            }
        }
    });

});

/* POST for registering property after login */
router.post('/property/register', function(req, res, next) {
    res.render('register_prop', { errors: req.flash('errors'), success: req.flash('success') });
});

/* Function to add land asset of given owner to blockchain */
async function addLand(land) {
    const { bizNetworkConnection, businessNetworkDefinition } = await connect();
    try {
        let factory = businessNetworkDefinition.getFactory();
        let newLand = factory.newResource('net.biz.digitalPropertyNetwork', 'LandTitle', 'LID' + land._id);
        newLand.owner = factory.newRelationship('net.biz.digitalPropertyNetwork', 'Person', 'PID' + land.owner);
        newLand.titleDeedLink = land.deedFileLink;
        newLand.imageLink = land.imageFileLink;
        let landRegistry = await bizNetworkConnection.getAssetRegistry('net.biz.digitalPropertyNetwork.LandTitle');
        await landRegistry.add(newLand);
    } catch (error) {
        console.log('* uh-oh', error);
    }
}

var cpUpload = landImageUpload.fields([{ name: 'deed', maxCount: 1 }, { name: 'image', maxCount: 1 }])
router.post('/property/register/new', cpUpload, function(req, res, next) {
    if (!req.files) {
        ''
        req.flash('errors', 'Please attach the required files');
        req.flash('success', false);
        return res.redirect(307, '/users/property/register');
    } else {
        var deedfilePathArray = req.files['deed'][0].path.split("/");
        let deedfilePath = "/images/uploads/lands/" + deedfilePathArray[deedfilePathArray.length - 1];
        let deedLink = req.protocol + "://" + req.hostname + ':4200/' + deedfilePath;

        var imagefilePathArray = req.files['image'][0].path.split("/");
        let imagefilePath = "/images/uploads/lands/" + imagefilePathArray[imagefilePathArray.length - 1];
        let imageLink = req.protocol + "://" + req.hostname + ':4200/' + imagefilePath;

        let newLand = new Land({
            owner: req.cookies.userID,
            plotNumber: req.body.plot_no,
            streetName: req.body.street,
            locality: req.body.locality,
            cityName: req.body.city,
            state: req.body.state,
            deedFileLink: deedLink,
            imageFileLink: imageLink
        });
        newLand.save(function(err) {
            if (err) {
                if (err.name == 'ValidationError') {
                    console.log(err);
                    req.flash('errors', err);
                    req.flash('success', false);
                    return res.redirect(307, '/users/property/register');
                } else {
                    console.log('Server side error: ' + err);
                    res.render('error', { message: err });
                }
            } else {
                async function addLandCb() {
                    await addLand(newLand);
                }
                addLandCb();
                req.flash('errors', '');
                req.flash('success', true);
                return res.redirect(307, '/users/property/register');
            }
        });
    }
});

async function addSaleAgreement(newSaleAgreement) {
    const { bizNetworkConnection, businessNetworkDefinition } = await connect();

    try {
        let factory = businessNetworkDefinition.getFactory();
        saleAgreementAsset = factory.newResource('net.biz.digitalPropertyNetwork', 'SalesAgreement', 'SID' + newSaleAgreement._id);
        saleAgreementAsset.buyer = factory.newRelationship('net.biz.digitalPropertyNetwork', 'Person', 'PID' + newSaleAgreement.buyer);
        saleAgreementAsset.seller = factory.newRelationship('net.biz.digitalPropertyNetwork', 'Person', 'PID' + newSaleAgreement.seller);
        saleAgreementAsset.title = factory.newRelationship('net.biz.digitalPropertyNetwork', 'LandTitle', 'LID' + newSaleAgreement.land);

        let saleAgreementRegistry = await bizNetworkConnection.getAssetRegistry('net.biz.digitalPropertyNetwork.SalesAgreement');
        await saleAgreementRegistry.add(saleAgreementAsset);
    } catch (error) {
        console.log('* uh-oh', error);
    }
}

router.post('/property/create/agreement', function(req, res, next) {
    let sellerId = req.cookies.userID;
    let buyerId = req.body.buyerId;
    let landId = req.body.landId;

    Land.findOne({}, function(err, land) {
        if (err) {
            console.log(err);
            res.render('error', { message: err });
        } else {
            if (land == null) {
                console.log(err);
                res.render('error', { message: err });
            } else {
                let newSaleAgreement = new SaleAgreement({
                    buyer: buyerId,
                    seller: sellerId,
                    land: landId,
                    landImage: land.imageFileLink,
                    landText: land.plotNumber + ' ' + land.streetName + ' ' + land.locality + ' ' + land.cityName
                });
                newSaleAgreement.save(function(err) {
                    if (err) {
                        if (err.name == 'ValidationError') {
                            res.json({ status: 'Nok', message: 'Some fields are missing. Please check and try again' });
                        } else {
                            console.log('Server side error: ' + err);
                            res.render('error', { message: err });
                        }
                    } else {
                        async function addSaleAgreementBeforeTransfer() {
                            await addSaleAgreement(newSaleAgreement);
                        }
                        addSaleAgreementBeforeTransfer();
                        res.json({ status: 'Ok', message: 'Sale agreement has been made. Please wait for approval. Sale agreement number is ' + newSaleAgreement._id })
                    }
                });
            }
        }
    });
});

router.post('/populate', function(req, res, next) {
    let userId = req.body.userId;
    User.findOne({ _id: userId }, function(err, user) {
        if (err) {
            console.log(err);
            res.render('error', { message: err });
        } else {
            if (user == null) {
                res.json({ status: 'Nok', message: 'Invalid User ID. Please check the Id given' });
            } else {
                res.json({ status: 'Ok', message: 'Retrieved land details', userDetails: user });
            }
        }
    });
});

router.post('/property/populate', function(req, res, next) {
    let landId = req.body.landID;
    Land.findOne({ _id: landId }, function(err, land) {
        if (err) {
            console.log(err);
            res.render('error', { message: err });
        } else {
            if (land == null) {
                res.json({ status: 'Nok', message: 'Invalid Land ID. Please check the Id given' });
            } else {
                res.json({ status: 'Ok', message: 'Retrieved land details', landDetails: land });
            }
        }
    });
});

router.post('/property/sell', function(req, res, next) {
    var userId = req.cookies.userID;
    Land.find({}, function(err, land) {
        if (err) {
            console.log(err);
            res.render('error', { message: err });
        } else {
            if (land == null) {
                land = [];
            } else {
                landList = [];
                for (var i = 0; i < land.length; ++i) {
                    landObject = {
                        nickname: land[i].locality + land[i].streetName + land[i].cityName,
                        id: land[i]._id
                    }
                    landList[i] = landObject;
                }
                User.find({ _id: { $ne: userId } }, function(err, user) {
                    if (err) {
                        console.log(err);
                        res.render('error', { message: err });
                    } else {
                        if (user == null) {
                            user = [];
                        } else {
                            var userList = [];
                            for (var i = 0; i < user.length; ++i) {
                                userObject = {
                                    name: user[i].fullName,
                                    id: user[i]._id
                                }
                                userList[i] = userObject;
                            }
                            res.render('sell_prop', { lands: landList, users: userList });
                        }
                    }
                });
            }
        }
    });
});

router.post('/property/view', function(req, res, next) {
    var landId = req.body.landId;
    Land.findOne({ _id: landId }, function(err, land) {
        if (err) {
            console.log(err);
            res.render('error', { message: err });
        } else {
            if (land == null) {
                return res.redirect(307, '/users/dashboard');
            } else {
                User.findOne({ _id: land.owner }, function(err, owner) {
                    if (err) {
                        console.log(err);
                        res.render('error', { message: err });
                    } else {
                        if (owner == null) {
                            return res.redirect(307, '/users/dashboard');
                        } else {
                            res.render('prop_details', { land: land, owner: owner })
                        }
                    }
                });
            }
        }
    });
});

/* POST for user login */
router.post('/login', function(req, res, next) {
    let email = req.body.email;
    let pass = req.body.password;
    User.findOne({ email: email }, function(err, user) {
        if (err) {
            req.flash('errors', 'Some error occured. Please try again!')
            req.flash('success', false);
            return res.redirect('/');
        } else {
            if (user == null) {
                req.flash('errors', 'User with this email does not exist!');
                req.flash('success', false);
                return res.redirect('/');
            }
            bcrypt.compare(pass, user.password, function(err, isMatch) {
                if (err) {
                    console.log(err);
                    req.flash('errors', 'Some error occured. Please try again!');
                    req.flash('success', false);
                    return res.redirect('/');
                }
                if (isMatch) {
                    res.cookie('userID', user._id, { maxAge: 3600 * 1000 * 24 * 365 });
                    return res.redirect(307, '/users/dashboard');
                } else {
                    req.flash('errors', 'Incorrect password!');
                    req.flash('success', false);
                    return res.redirect('/');
                }
            });
        }
    });
});

/* GET user registration page */
router.get('/register', function(req, res, next) {
    res.render('signup', { errors: "", success: false });
});

async function addUser(user) {
    const { bizNetworkConnection, businessNetworkDefinition } = await connect();

    try {
        let id = user._id;
        let firstName = user.firstName;
        let lastName = user.lastName;

        let factory = businessNetworkDefinition.getFactory();
        individual = factory.newResource('net.biz.digitalPropertyNetwork', 'Person', 'PID' + id);
        individual.firstName = firstName;
        individual.lastName = lastName;

        let personRegistry = await bizNetworkConnection.getParticipantRegistry('net.biz.digitalPropertyNetwork.Person');
        await personRegistry.add(individual);
    } catch (error) {
        console.log('* uh-oh', error);
    }
}

/* POST for registering user */
router.post('/register', upload.single('aadhaarFile'), function(req, res, next) {
    if (!req.file) {
        return res.render('signup', { errors: 'Aadhaar file has not been attached!', success: false });
    } else {
        var filePathArray = req.file.path.split("/");
        let filePath = "/images/uploads/users/Aadhaar/" + filePathArray[filePathArray.length - 1];
        let fileLink = req.protocol + "://" + req.hostname + ':4200/' + filePath;
        let newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            mobilePhone: req.body.mobilePhone,
            password: req.body.password,
            aadhaarNumber: req.body.aadhaarNumber,
            aadhaarFileLink: fileLink
        });
        newUser.save(function(err) {
            if (err) {
                if (err.name == 'ValidationError') {
                    res.render('signup', { errors: err, success: false });
                } else {
                    // console.log('Server side error: ' + err);
                    res.render('error', { message: err });
                }
            } else {
                async function addUserDuringSignup() {
                    await addUser(newUser);
                }
                addUserDuringSignup();
                res.render('signup', { errors: "", success: true, id: newUser._id });
            }
        });
    }
});

/*GET for initiating fingerprint verification*/
router.get('/fingerprint/initiate', function(req, res, next) {
    const fingerprint = new Fingerprint({
        sellerAadhaar: req.query.sellerAadhaar,
        landId: req.query.landId
    });
    fingerprint.save().then(createdFingerprint => {
        res.status(201).json({
            message: "Event added successfully"
        });
    });
});

/*GET to validate that fingerprint was verified on the app*/
router.get('/fingerprint/verify', function(req, res, next) {
    let query = { sellerAadhaar: req.query.aadhaar, landId: req.query.landId }
    Fingerprint.update(query, { $set: { fingerprintValidated: true } }, { multi: true },
        function(error, success) {
            if (error) {
                // console.log(error);
                res.status(404).json({ message: "Something went wrong. Please check log." });
            } else {
                // console.log("fingerprint validation success");
                res.status(200).json({ message: "Fingerprint Validated" });
            }
        }
    );
});

/*GET to check if validation is done */
router.get('/fingerprint/check', function(req, res, next) {
    let query = { sellerAadhaar: req.query.aadhaar, landId: req.query.landId }
    Fingerprint.find({ "sellerAadhaar": req.query.aadhaar }).sort({ createdAt: -1 }).limit(1).then(fingerprint => {
        if (fingerprint[0].fingerprintValidated) {
            res.status(200).json({ validated: true });
        } else {
            res.status(200).json({ validated: false });
        }
    });
});

/*GET to retrieve details for the app*/
router.get('/fingerprint/retrieve', function(req, res, next) {
    Fingerprint.find({ "sellerAadhaar": req.query.aadhaar }).sort({ createdAt: -1 }).limit(1).exec((err, data) => {
        if (err) {
            res.status(201).json({ message: "Incorrect value" });
        } else {
            res.status(200).json(data);
        }
    });
});

module.exports = router;
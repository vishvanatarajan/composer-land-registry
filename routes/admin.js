var express = require('express');
var router = express.Router();

let Land = require('../models/lands')
let SaleAgreement = require('../models/saleAgreement')
const { connect } = require('../config/connect');

/* GET to render login page */
router.get('/', function(req, res, next) {
  res.render('gov_official_login', { error: '' });
});

/* POST for user login */
router.post('/login', function(req, res, next) {
  let email = req.body.email;
  let password = req.body.password;
  if(email == 'john.doe@gmail.com' && password == 'john123') {
    res.cookie('officerId', '1111', { maxAge: 3600 * 1000 * 24 * 365 });
    res.redirect(307, '/admin/dashboard')
  } else {
    res.render('gov_official_login', { error:'Incorrect email Id or password' });
  }
});

router.post('/dashboard', function(req, res, next) {
  SaleAgreement.find({}, function(err, saleAgreement) {
    if(err) {
      console.log(err);
      res.render('error', { message:err });
    } else {
      if(saleAgreement == null) {
        res.render('official_dashboard', { agreements:[] });
      } else {
        res.render('official_dashboard', { agreements: saleAgreement});
      }
    }
  });
});

async function performTransaction(sellerId, buyerId, titleId, officerId) {
  try {
		let TransactionSubmit = require('composer-cli').Transaction.Submit;
		
		let options = {
			card: 'admin@land-registry-network',
			data: `{
				"$class": "net.biz.digitalPropertyNetwork.AprooveSaleAgreement",
				"seller": "resource:net.biz.digitalPropertyNetwork.Person#PID${sellerId}",
				"buyer": "resource:net.biz.digitalPropertyNetwork.Person#PID${buyerId}",
        "title": "resource:net.biz.digitalPropertyNetwork.LandTitle#LID${titleId}",
        "officer": "resource:net.biz.digitalPropertyNetwork.Official#OID:${officerId}"
			}`
		};
		TransactionSubmit.handler(options);
	} catch (error) {
		console.error('Error in submitting transaction:', error);
	}
}


router.post('/title/transfer', function(req, res, next) {
  // 1. Change owner of piece of land in lands collection
  // 2. Perform transfer transaction on blockchain network
  // 3. Delete saleAgreement from saleAgreements collection

  let agreementId = req.body.agreementId;
  let landId = req.body.landId;

  // Change owner of land in lands collection
  SaleAgreement.findOne({ _id: agreementId }, function(err, saleAgreement) {
    if(err) {
      console.log(err);
      return res.json({status:'Nok', message:'Some error occured. Please try again'})
    } else {
      if(saleAgreement == null) {
        return res.json({status:'Nok', message:'Some error occured. Please try again'})
      } else {
        // Update land collection
        Land.findOne({"_id": landId}, function(err, doc) {
          if(err) {
            console.log(err);
            return res.json({status:'Nok', message:'Some error occured'});
          }
          doc.owner = saleAgreement.buyer
          doc.save();
        });
      }
    }
  });

  SaleAgreement.findOne({ _id: agreementId }, function(err, saleAgreement) {
    if(err) {
      console.log(err);
    } else {
      if(saleAgreement == null) {
      } else {
        let sellerId = saleAgreement.seller;
        let buyerId = saleAgreement.buyer;
        let titleId = saleAgreement.land;
        let officialId = req.cookies.officerId;

        // create transaction on Blockchain
        async function performTransactionWrapper(sellerId, buyerId, titleId, officialId) {
          await performTransaction(sellerId, buyerId, titleId, officialId);
        }
        performTransactionWrapper(sellerId, buyerId, titleId, officialId);
      }
    }
  });


  // delete saleAgreement from saleAgreements collection
  SaleAgreement.deleteOne({_id: agreementId})
    .then((result) => {
      if(!result.ok) {
        return res.json({status:'Nok', message:'Some error occured while deleting sale agreement'});
      }
    });

  return res.json({status:'Ok', message:'Transaction occured successfully!'});
});

module.exports = router
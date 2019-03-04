var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { errors:req.flash('errors'), success:req.flash('success') });
});

module.exports = router;

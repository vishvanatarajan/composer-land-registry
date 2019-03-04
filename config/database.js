let mongoose = require('mongoose');

const server = '127.0.0.1:27017';
const database = 'landregistryDB';
const dbURI = 'mongodb://' + server + '/' + database;

mongoose.connect(dbURI, { useNewUrlParser: true, useCreateIndex: true });

// When successfully connected
mongoose.connection.on('connected', function () {  
  console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {  
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  console.log('Mongoose default connection disconnected'); 
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log('Mongoose default connection disconnected through app termination'); 
    process.exit(0); 
  }); 
});

//Get the default connection
var db = mongoose.connection;
module.exports = db
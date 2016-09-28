var config = require('./config');

var fs = require('fs');
var ProgressBar = require('progress');
var Promise = require('bluebird');
var moment = require('moment');
var mongoose = require('mongoose');
var csvStringify = require('csv-stringify');

mongoose.Promise = Promise;
mongoose.connect(config.mongo.uri);

mongoose.connection.on('error', function (err) { throw err; });

var modelName, schemaToExtract, query, csvHead, csvLines = [];

// Define Model name and Schema

modelName = 'Request';
schemaToExtract = new mongoose.Schema({
  vehicle: {},
  vehicle_kms: Number,
  pickup_time: Date
});

query = {
  'canceled.status': false,
  'pickup_time': { $exists: true },
  'vehicle.licenseplate': { $exists: true }
};

csvHead = 'Brand, Model, Licenseplate, Kms, Pickup time'.split(',');
csvLines.push(csvHead);

var modelToExtract = mongoose.model(modelName, schemaToExtract);

modelToExtract
.find(query)
.exec(function (err, results) {
  if (err) throw err;

  console.log('Found %s results', results.length);
  console.log();

  var bar = new ProgressBar('  downloading [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: results.length
  });

  results.forEach(function (result, index) {
    bar.tick(index);

    if (!result.pickup_time) {
      console.log(result);
      throw new Error('Result index ' + index + ' doesnt have pickup_time');
    }

    var r = result;
    // Define cols
    var line = [
      r.vehicle.brand.trim().toUpperCase(),
      r.vehicle.model.trim().toUpperCase(),
      r.vehicle.licenseplate.replace(new RegExp("[^0-9a-zA-Z]+"), "").replace(/ /g, ""),
      r.vehicle_kms,
      moment(r.pickup_time).format('DD/MM/YYYY')
    ];

    csvLines.push(line);
  });
  console.log('End foreach');
  generateCsv(csvLines);
});

function generateCsv (linesArray) {
  if (!Array.isArray(linesArray) || !linesArray.length) throw new Error('generateCsv(): Input is not array or not length');
  csvStringify(linesArray, function (err, output) {
    if (err) throw err;
    console.log('writing file..');
    writeFile(output);
  });
}

function writeFile (text) {
  var filePath = __dirname + '/the.csv';
  fs.writeFile(filePath, text, function(err) {
    if(err) {
        throw err;
    }

    console.log("The file was saved!", filePath);
    process.exit(-1);
});

}

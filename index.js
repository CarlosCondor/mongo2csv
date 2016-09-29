if (process.argv.length < 3) {
  console.error('Path to config file is required. Use node index.js myConfig.js');
  console.error('Make a copy of config.example.js to create your config file.');
  process.exit(-1);
}

var config;
try {
  config = require('./' + process.argv[2]);
} catch (e) {
  throw e;
  process.exit(-1);
}

var _ = require('lodash');
var fs = require('fs');
var ProgressBar = require('progress');
var Promise = require('bluebird');
var moment = require('moment');
var mongoose = require('mongoose');
var csvStringify = require('csv-stringify');

mongoose.Promise = Promise;
mongoose.connect(config.mongo.uri);

mongoose.connection.on('error', function (err) { throw err; });

var schemaToExtract, csvHead, csvLines = [];

// Define Model name and Schema

schemaToExtract = new mongoose.Schema(config.sourceSchema, {collection: config.sourceCollection});

csvHead = _.map(config.csv, 'key');
csvLines.push(csvHead);

var modelToExtract = mongoose.model('ModelToExtract', schemaToExtract);

modelToExtract
.find(config.query)
.exec(function (err, results) {
  if (err) throw err;

  console.log('Found %s results', results.length);
  console.log();

  // var bar = new ProgressBar('  Converting [:bar] :percent :etas', {
  //   complete: '=',
  //   incomplete: ' ',
  //   width: 20,
  //   total: results.length
  // });

  results.forEach(function (result, index) {
    // bar.tick(index);

    var r = result;
    var line = [];
    config.csv.forEach(function (col) {
      if (!col.key) throw new Error('Each csv item need to have property: key');
      if (!col.value) throw new Error('Each csv item need to have property: value');

      var valueKey;
      var tmpValue = result;

      /**
       *  If value is $ and has map function, then value is set to root documment
       **/
      if (col.value === '$' && col.map) {
        valueKey = result;
      } else {
        col.value.split('.').forEach(function (v, index) {

          if (v in tmpValue) {
            tmpValue = tmpValue[v];
            if (!tmpValue && !col.allowNull) {
              throw new Error('Value for '+ v +' cant be blank');
            }
          } else {
            console.log('Can not get property %s from', v, tmpValue);
            throw new Error('Can not get property ' + v + ' from documment');
          }

        });
        valueKey = tmpValue || "";
      }

      var dataMapped = valueKey && col.map && typeof col.map === 'function' ? col.map(valueKey) : valueKey;

      line.push( dataMapped );
    });

    csvLines.push(line);
  });
  generateCsv(csvLines);
});

function generateCsv (linesArray) {
  if (!Array.isArray(linesArray) || !linesArray.length) throw new Error('generateCsv(): Input is not array or havent length');
  csvStringify(linesArray, function (err, output) {
    if (err) throw err;
    console.log('writing file..');
    writeFile(output);
  });
}

function writeFile (text) {
  fs.writeFile(config.exportFilePath, text, function(err) {
    if(err) {
        throw err;
    }

    console.log("The file was saved!", config.exportFilePath);
    process.exit(-1);
  });
}

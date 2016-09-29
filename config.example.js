var moment = require('moment');

module.exports = {
  mongo: {
    uri: 'mongodb://localhost/backup28Sept'
  },

  // Path to export csv
  exportFilePath: __dirname + '/theExample.csv',

  // Name of collection to perform query
  sourceCollection: 'requests',
  // Schema to export to csv
  sourceSchema: {
    vehicle: {}
  },
  // Query to perform to mongodb
  query: {
    'vehicle.brand': { $exists: true },
  },
  // Fields to export
  csv: [
    {
      // Column name
      key: 'Brand',
      // Fill with collection property
      value: 'vehicle.brand',
      // Apply map to result
      map: function (v) {
        return v.trim().toUpperCase();
      },
      // Throw error if documment value is blank
      allowNull: false
    },
    {
      key: 'Model',
      value: 'vehicle.model',
      map: function (v) {
        return v.trim().toUpperCase();
      },
      allowNull: true
    },
    {
      key: 'Licenseplate',
      value: 'vehicle.licenseplate',
      map: function (v) {
        v.replace(new RegExp("[^0-9a-zA-Z]+"), "").replace(/ /g, "");
      },
      allowNull: true
    },
    {
      key: 'Full Vehicle Model',
      value: '$', // <-- $ == root documment
      map: function (v) {
        return v.vehicle.brand + ' ' + v.vehicle.model;
      }
    }

  ]
};

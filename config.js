var moment = require('moment');

module.exports = {
  mongo: {
    uri: 'mongodb://localhost/backup28Sept'
  },

  exportFilePath: __dirname + '/the.csv',

  sourceCollection: 'requests',
  sourceSchema: {
    vehicle: {},
    vehicle_kms: Number,
    pickup_time: Date
  },
  query: {
    'canceled.status': false,
    'pickup_time': { $exists: true },
    'vehicle.licenseplate': { $exists: true }
  },
  csv: [
    {
      key: 'Brand',
      value: 'vehicle.brand',
      map: function (v) {
        return v.trim().toUpperCase();
      }
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
        return v.replace(new RegExp("[^0-9a-zA-Z]+"), "").replace(/ /g, "");
      },
      allowNull: true
    },
    {
      key: 'Kms',
      value: 'vehicle_kms',
      allowNull: true
    },
    {
      key: 'Pickup time',
      value: 'pickup_time',
      map: function (v) {
        return moment(v).format('DD/MM/YYYY');
      }
    },
    {
      key: 'Own',
      value: '$',
      map: function (v) { return v.vehicle.licenseplate; }
    }
  ]
};

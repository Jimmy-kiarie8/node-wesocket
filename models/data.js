const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  uid: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  bearing: {
    type: Number,
    required: false
  },
  orderId: {
    type: Number,
    required: true
  }
});

const Data = mongoose.model('Data', dataSchema);

module.exports = Data;

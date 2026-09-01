const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  
  branch: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 50000 
  }
}, {
  timestamps: true
})

module.exports = mongoose.model(
  'Customer',
  customerSchema
)
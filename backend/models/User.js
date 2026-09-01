const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true // e.g., 'admin' or 'customer'
  },
  //  ASSIGNED BANK BRANCH:
  branch: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  
  balance: {
    type: Number,
    default: 50000 
  },
  
  transactionPin: {
    type: String,
    required: true,
    default: '1234' 
  },
  
  
  currentChallenge: { 
    type: String 
  },
  passkeys: [{
    credentialID: { type: String, required: true },
    publicVerifyingKey: { type: String, required: true }, // Encoded public key string
    counter: { type: Number, default: 0 },
    transports: [String] // Array tracking physical options e.g. ['internal']
  }]
}, {
  timestamps: true
})


module.exports = mongoose.models.User || mongoose.model('User', userSchema)
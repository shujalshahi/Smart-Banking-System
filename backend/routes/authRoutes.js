const express = require('express')
const router = express.Router()
const { 
  loginUser, 
  registerUser,
  updateAccountPassword, // 🔑 IMPORT NEW PASSWORD UPDATE FUNCTION
  updateTransactionPin  // 🔒 IMPORT NEW PIN UPDATE FUNCTION
} = require('../controllers/authController')

// Route for logging in
router.post('/login', loginUser)

// Route for admin to add customers
router.post('/register', registerUser)

// 🔑 ROUTE FOR CUSTOMERS TO CHANGE LOGIN PASSWORD
router.put('/update-password', updateAccountPassword)

// 🔒 ROUTE FOR CUSTOMERS TO CHANGE TRANSACTION PIN
router.put('/update-pin', updateTransactionPin)

module.exports = router
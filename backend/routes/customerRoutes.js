const express = require('express')
const router = express.Router()

const {
  getCustomers,
  addCustomer,
  deleteCustomer,
  updateCustomer,
  getCustomerById
} = require('../controllers/customerController')

// GET ALL CUSTOMERS
router.get('/', getCustomers)

// GET SINGLE CUSTOMER BY ID (Used by the frontend to fetch live balance)
router.get('/:id', getCustomerById)

// ADD NEW CUSTOMER
router.post('/', addCustomer)

// DELETE CUSTOMER
router.delete('/:id', deleteCustomer)

// UPDATE CUSTOMER DETAILS
router.put('/:id', updateCustomer)

module.exports = router
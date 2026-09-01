const express = require('express')

const router = express.Router()

const {
  getTransactions,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  downloadStatement // 1. ADD THIS IMPORT HERE
} = require('../controllers/transactionController')


// GET ALL TRANSACTIONS
router.get(
  '/',
  getTransactions
)

// 2. ADD THIS NEW ROUTE FOR SINGLE TRANSACTION PDF DOWNLOAD
// GET /api/transactions/:id/download-statement
router.get(
  '/:id/download-statement',
  downloadStatement
)


// ADD
router.post(
  '/',
  addTransaction
)


// DELETE
router.delete(
  '/:id',
  deleteTransaction
)


// UPDATE
router.put(
  '/:id',
  updateTransaction
)

module.exports = router
const Transaction = require('../models/Transaction')
const User = require('../models/User')
const PDFDocument = require('pdfkit')
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS      
  }
})

// GET TRANSACTIONS
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
    res.json(transactions)
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Failed to fetch transactions'
    })
  }
}

// ADD TRANSACTION (PIN REQUIRED FOR ALL USERS - INCLUDING ADMINS)
const addTransaction = async (req, res) => {
  try {
    const {
      sender,
      receiver,
      amount,
      type,
      status,
      date,
      pin 
    } = req.body

    let cleanAmount = amount;
    if (typeof amount === 'string') {
      cleanAmount = amount.replace(/[^\d.]/g, ''); 
    }
    
    const numericAmount = Number(cleanAmount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ 
        message: 'Transaction rejected: Invalid amount format received.' 
      })
    }

    const senderUser = await User.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${sender}$`, 'i') } },
        { email: sender?.toLowerCase() }
      ]
    })
    
    if (!senderUser) {
      return res.status(404).json({ message: `Transaction failed: Sender account matching '${sender}' not found.` })
    }

    if (!pin) {
      return res.status(400).json({ message: 'Transaction rejected: Security validation PIN is required.' })
    }

    if (String(senderUser.transactionPin) !== String(pin)) {
      return res.status(401).json({ message: 'Transaction rejected: Incorrect security transaction PIN.' })
    }

    const currentSenderBalance = senderUser.balance !== undefined ? senderUser.balance : 0;

    if (currentSenderBalance < numericAmount) {
      return res.status(400).json({ 
        message: `Transaction rejected: Insufficient funds. Available balance is Rs. ${currentSenderBalance.toLocaleString('en-IN')}` 
      })
    }

    const receiverUser = await User.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${receiver}$`, 'i') } },
        { email: receiver?.toLowerCase() }
      ]
    })
    
    if (!receiverUser) {
      return res.status(404).json({ message: `Transaction failed: Receiver account matching '${receiver}' not found.` })
    }

    if (senderUser._id.toString() === receiverUser._id.toString()) {
      return res.status(400).json({
        message: 'Transaction rejected: You cannot transfer banking assets to your own account profile.'
      })
    }

    // Deduct amount from sender
    await User.findByIdAndUpdate(senderUser._id, { $inc: { balance: -numericAmount } })
    
    // Credit amount to receiver
    await User.findByIdAndUpdate(receiverUser._id, { $inc: { balance: numericAmount } })

    const transaction = new Transaction({
      sender: senderUser.name, 
      receiver: receiverUser.name,
      amount: numericAmount,
      type: type || 'Transfer',
      status: 'Success', 
      date: date || new Date()
    })

    const savedTransaction = await transaction.save()

    const updatedSender = await User.findById(senderUser._id)
    const updatedReceiver = await User.findById(receiverUser._id)

    const senderMailOptions = {
      from: `"Secure Banking Portal" <${process.env.EMAIL_USER}>`,
      to: updatedSender.email,
      subject: 'Transaction Alert: Account Debited 💸',
      text: `Hello ${updatedSender.name},\n\nThis is to notify you that a transaction has occurred on your account.\n\nTransaction Details:\n- Type: Debited\n- To Account: ${updatedReceiver.name}\n- Amount: Rs. ${numericAmount.toLocaleString('en-IN')}\n- Date/Time: ${new Date().toLocaleString()}\n- Current Available Balance: Rs. ${updatedSender.balance.toLocaleString('en-IN')}\n\nIf you did not authorize this transaction, please contact our support team immediately.\n\nBest Regards,\nOperations Team`
    }

    const receiverMailOptions = {
      from: `"Secure Banking Portal" <${process.env.EMAIL_USER}>`,
      to: updatedReceiver.email,
      subject: 'Transaction Alert: Account Credited 🎉',
      text: `Hello ${updatedReceiver.name},\n\nGood news! You have received a fund transfer into your account.\n\nTransaction Details:\n- Type: Credited\n- From Account: ${updatedSender.name}\n- Amount: Rs. ${numericAmount.toLocaleString('en-IN')}\n- Date/Time: ${new Date().toLocaleString()}\n- Current Available Balance: Rs. ${updatedReceiver.balance.toLocaleString('en-IN')}\n\nLog into your web portal dashboard to view your updated statements.\n\nBest Regards,\nOperations Team`
    }

    transporter.sendMail(senderMailOptions, (err) => {
      if (err) console.error('Failed to send debit alert email to sender:', err)
      else console.log(`Debit alert email sent to ${updatedSender.email}`)
    })

    transporter.sendMail(receiverMailOptions, (err) => {
      if (err) console.error('Failed to send credit alert email to receiver:', err)
      else console.log(`Credit alert email sent to ${updatedReceiver.email}`)
    })

    res.status(201).json({
      message: 'Transaction completed and balances synchronized successfully! 💸',
      transaction: savedTransaction
    })

  } catch (error) {
    console.error('CRITICAL TRANSACTION CONTROLLER ERROR:', error)
    res.status(500).json({
      message: 'Transaction execution failed due to an internal server state error',
      error: error.message
    })
  }
}

// DELETE TRANSACTION
const deleteTransaction = async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id)
    res.json({
      message: 'Transaction Deleted'
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Delete failed'
    })
  }
}

// UPDATE TRANSACTION
const updateTransaction = async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    res.json(updatedTransaction)
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Update failed'
    })
  }
}

const downloadStatement = async (req, res) => {
  try {
    const transactionId = req.params.id

    const tx = await Transaction.findById(transactionId)
    if (!tx) {
      return res.status(404).json({ message: 'Transaction record not found.' })
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-${transactionId}.pdf`)

    const doc = new PDFDocument({ margin: 50 })
    doc.pipe(res)

    doc.fillColor('#0f172a').fontSize(22).text('SMART BANKING SYSTEM', { align: 'center' })
    doc.fontSize(10).fillColor('#64748b').text('Official Transaction E-Receipt', { align: 'center' })
    doc.moveDown(2)
    
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke()
    doc.moveDown(1.5)

    doc.fillColor('#1e293b').fontSize(11).text('Transaction ID: ', { continued: true }).font('Helvetica-Bold').text(tx._id.toString())
    doc.font('Helvetica').moveDown(0.5)
    
    doc.text('Sender Account: ', { continued: true }).font('Helvetica-Bold').text(tx.sender)
    doc.font('Helvetica').moveDown(0.5)

    doc.text('Receiver Account: ', { continued: true }).font('Helvetica-Bold').text(tx.receiver || 'N/A')
    doc.font('Helvetica').moveDown(0.5)
    
    doc.text('Transaction Date: ', { continued: true }).font('Helvetica-Bold').text(tx.date ? String(tx.date) : 'N/A')
    doc.font('Helvetica').moveDown(1.5)

    const currentY = doc.y
    doc.rect(50, currentY, 500, 70).fill('#f8fafc').stroke()
    doc.fillColor('#0f172a')
    
    doc.fontSize(10).text('Method Pathway:', 70, currentY + 15)
    doc.fontSize(14).font('Helvetica-Bold').text(tx.type ? tx.type.toUpperCase() : 'TRANSFER', 70, currentY + 35)

    doc.fontSize(10).font('Helvetica').text('Transaction Status:', 240, currentY + 15)
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#16a34a').text(tx.status || 'SUCCESS', 240, currentY + 35)

    doc.fillColor('#0f172a')
    doc.fontSize(10).font('Helvetica').text('Settlement Net:', 410, currentY + 15)
    doc.fontSize(14).font('Helvetica-Bold').text(`Rs. ${Number(tx.amount).toLocaleString('en-IN')}`, 410, currentY + 35)

    doc.x = 50
    doc.y = currentY + 100

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke()
    doc.moveDown(1.2)
    doc.fillColor('#94a3b8').fontSize(8.5).text('This verification file is officially recompiled automatically by secure cryptographic ledgers from your core database architecture and is valid without physical authentication stamp components.', { align: 'center', width: 500 })

    doc.end()

  } catch (error) {
    console.error('CRITICAL STATEMENT GENERATION ERROR:', error)
    res.status(500).json({ message: 'Internal error assembling digital statement processing asset.' })
  }
}

module.exports = {
  getTransactions,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  downloadStatement
}
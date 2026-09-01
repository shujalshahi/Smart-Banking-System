// 1. USING THE UNIFIED USER MODEL LOGGED IN BY YOUR AUTH CONTROLLER
const User = require('../models/User')
const nodemailer = require('nodemailer')
const os = require('os'); 

// fetches the current Wi-Fi Local IP address
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    for (const iface of interfaces[interfaceName]) {
      // looks for an IPv4 address that isn't a local loopback (127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address; // Returns the current Wi-Fi IP (e.g., '192.168.1.X')
      }
    }
  }
  return 'localhost'; // Fallback to localhost if no active Wi-Fi is detected
};

// CONFIGURE SMTP EMAIL TRANSPORTER DYNAMICALLY FROM .ENV
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS      
  }
})


const isValidEmailFormat = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// GET ALL CUSTOMERS
const getCustomers = async (req, res) => {
  try {
    
    const customers = await User.find({ role: 'customer' })
    res.json(customers)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Failed to fetch customers' })
  }
}


const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)

    if (!customer) {
      return res.status(404).json({ message: 'Customer account not found' })
    }

    res.json(customer)
  } catch (error) {
    console.log(error)
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Customer ID format' })
    }
    res.status(500).json({ message: 'Error retrieving account profile' })
  }
}

// ADD CUSTOMER (WITH VALIDATION, SHARED MODEL SAVING, CUSTOM TRANSACTION PIN & NODEMAILER DISPATCH)
const addCustomer = async (req, res) => {
  console.log(req.body)
  try {
    
    const { name, email, branch, balance, password, transactionPin } = req.body

   
    if (!email || !isValidEmailFormat(email)) {
      return res.status(400).json({
        message: 'Customer not saved. Please provide a valid email address (e.g., user@example.com).'
      })
    }

    
    if (!branch) {
      return res.status(400).json({
        message: 'Customer not saved. Please assign a bank branch.'
      })
    }

    
    const existingCustomer = await User.findOne({ email: email.toLowerCase() })
    if (existingCustomer) {
      return res.status(400).json({
        message: 'Customer not saved. This email address is already registered.'
      })
    }

    
    const parsedBalance = (balance !== undefined && balance !== "") ? Number(balance) : 0
    const finalPassword = password || 'customer123'
    const finalPin = transactionPin || '1234' //  Defaults pin is set to 1234 if the admin leaves the field empty

    
    const customer = new User({
      name,
      email: email.toLowerCase().trim(),
      branch, 
      balance: parsedBalance,
      password: finalPassword,
      transactionPin: finalPin, 
      role: 'customer' 
    })

    const savedCustomer = await customer.save()

    
    const currentIp = getLocalIpAddress();
    const dynamicLoginLink = `http://${currentIp}:5173`; 

    
    const mailOptions = {
      from: `"Secure Banking Portal" <${process.env.EMAIL_USER}>`,
      to: savedCustomer.email,
      subject: 'Welcome to Secure Banking - Account Created Successfully 🎉',
      text: `Hello ${savedCustomer.name},\n\nYour customer banking profile has been successfully configured by the system administrator.\n\nAccount Access Credentials:\n- Mobile/Web Login Link: ${dynamicLoginLink}\n- Registered Email: ${savedCustomer.email}\n- Assigned Branch: ${savedCustomer.branch}\n- Temporary Password: ${finalPassword}\n- Secure Transaction PIN: ${finalPin}\n- Starting Account Balance: Rs. ${parsedBalance.toLocaleString('en-IN')}\n\nPlease ensure your mobile device is connected to the same Wi-Fi network as the server, then log in, change your password, and personalize your security PIN immediately.\n\nBest Regards,\nOperations Team`,
    }

    transporter.sendMail(mailOptions, (mailErr, info) => {
      if (mailErr) {
        console.error('Nodemailer system failed to send dispatch:', mailErr)
      } else {
        console.log('Onboarding email sent successfully to client:', info.response)
      }
    })

    res.status(201).json(savedCustomer)

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Customer not saved due to an internal server error' })
  }
}

// DELETE CUSTOMER
const deleteCustomer = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'Customer Deleted' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Delete failed' })
  }
}

// UPDATE CUSTOMER
const updateCustomer = async (req, res) => {
  try {
    
    const { name, email, branch } = req.body

    const updatedCustomer = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, branch },
      { new: true }
    )
    res.json(updatedCustomer)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Update failed' })
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  addCustomer,
  deleteCustomer,
  updateCustomer
}
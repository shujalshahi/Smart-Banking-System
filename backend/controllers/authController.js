const User = require('../models/User')


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({
      email,
      password
    })

    if (!user) {
      return res.status(401).json({
        message: 'Invalid Email or Password'
      })
    }

    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance, 
      image: user.image,
      
      hasBiometrics: !!(user.passkeys && user.passkeys.length > 0)
    })

  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Login failed'
    })
  }
}

// REGISTER / ADD CUSTOMER FUNCTION
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, balance } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const parsedBalance = (balance !== undefined && balance !== "") ? Number(balance) : 0

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password, 
      balance: parsedBalance, 
      role: role || 'customer'
    })

    res.status(201).json({
      message: 'Customer added successfully!',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        balance: newUser.balance
      }
    })

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Failed to add customer' })
  }
}


const updateAccountPassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All password authentication fields are required.' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User profile instance not found.' })
    }

    // Verify plain-text password match
    if (user.password !== currentPassword) {
      return res.status(401).json({ message: 'Verification failed: Current password is incorrect.' })
    }

    user.password = newPassword
    await user.save()

    res.status(200).json({ message: 'Account login password updated successfully! 🔑' })
  } catch (error) {
    console.error('PASSWORD UPDATE ERROR:', error)
    res.status(500).json({ message: 'Internal server error processing security credentials.' })
  }
}


const updateTransactionPin = async (req, res) => {
  try {
    const { userId, currentPin, newPin } = req.body

    if (!userId || !currentPin || !newPin) {
      return res.status(400).json({ message: 'All PIN verification fields are required.' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User profile instance not found.' })
    }

    // Fallback comparison check against unprovisioned or default system assets
    const userDbPin = user.transactionPin !== undefined ? String(user.transactionPin) : "1234"

    if (userDbPin !== String(currentPin)) {
      return res.status(401).json({ message: 'Verification failed: Current security PIN is incorrect.' })
    }

    user.transactionPin = String(newPin)
    await user.save()

    res.status(200).json({ message: 'Security transaction PIN updated successfully! 🔒' })
  } catch (error) {
    console.error('PIN UPDATE ERROR:', error)
    res.status(500).json({ message: 'Internal server error processing security credentials.' })
  }
}

module.exports = {
  loginUser,
  registerUser,
  updateAccountPassword, 
  updateTransactionPin  
}
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const customerRoutes = require('./routes/customerRoutes')
const transactionRoutes = require('./routes/transactionRoutes')
const authRoutes = require('./routes/authRoutes')
const branchRoutes = require('./routes/branchRoutes')
const employeeRoutes = require('./routes/employeeRoutes') // 👥 IMPORT EMPLOYEE ROUTES
// 🔐 IMPORT BIOMETRIC ROUTES
const biometricRoutes = require('./routes/biometricRoutes')

const app = express()

// Connect to Database
connectDB()

// Enable CORS for all origins so your mobile phone can access the endpoints
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

// 🛠️ FIXED: Increased limits to allow Base64 profile picture string uploads
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ limit: '5mb', extended: true }))

// ROUTES
app.use(
  '/customers',
  customerRoutes
)

app.use(
  '/transactions',
  transactionRoutes
)

app.use(
  '/auth',
  authRoutes
)

app.use(
  '/branches',
  branchRoutes
)

// 👥 REGISTER EMPLOYEE ROUTES
app.use(
  '/employees',
  employeeRoutes
)

// 🔐 CONNECT BIOMETRIC HANDSHAKE ROUTES
app.use(
  '/auth/biometric',
  biometricRoutes
)

const PORT = 4300

// Listening on '0.0.0.0' allows connections from external devices on your Wi-Fi
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Point your mobile phone's frontend API settings to your laptop's Wi-Fi IP address on port ${PORT}`)
})
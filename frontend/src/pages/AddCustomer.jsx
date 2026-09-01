import React, { useState } from 'react'
import API from '../services/api' 
import '../styles/login.css' 

const AddCustomer = () => {
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setCustomerData({
      ...customerData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      // Uses the base URL configured in the services/api.js for example http://192.168.1.65:4300
      const response = await API.post('/auth/register', customerData)
      setMessage(response.data.message)
      setCustomerData({ name: '', email: '', password: '', role: 'customer' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer')
    }
  }

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="login-container" style={{ maxWidth: '500px', width: '100%', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' }}>
        <div className="login-right" style={{ width: '100%' }}>
          <h2 className="login-title" style={{ marginBottom: '10px' }}>Add New Customer</h2>
          <p className="login-subtitle" style={{ marginBottom: '20px', color: '#666' }}>Create a new user account directly in the system</p>

          {message && <p style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{message}</p>}
          {error && <p style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</p>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="input-group">
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Full Name</label>
              <div className="input-box">
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={customerData.name}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Email Address</label>
              <div className="input-box">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={customerData.email}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Password</label>
              <div className="input-box">
                <input
                  type="password"
                  name="password"
                  placeholder="Create user password"
                  value={customerData.password}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '15px',
                fontSize: '16px',
                display: 'block',
                textAlign: 'center'
              }}
            >
              Create Customer Account
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddCustomer
import React, { useState } from 'react'
import API, { loginWithBiometrics } from '../services/api' 
import { useNavigate } from 'react-router-dom'
import { FaEnvelope, FaLock, FaUniversity, FaFingerprint } from 'react-icons/fa'
import '../styles/login.css'

const Login = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  
  const [bioLoading, setBioLoading] = useState(false)

  // DYNAMIC TIME GREETING HELPER
  const getGreeting = () => {
    const currentHour = new Date().getHours()
    
    if (currentHour < 12) {
      return 'Good Morning'
    } else if (currentHour < 18) {
      return 'Good Afternoon'
    } else {
      return 'Good Evening'
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    try {
      
      const response = await API.post(
        '/auth/login',
        formData
      )

      localStorage.setItem(
        'user',
        JSON.stringify(response.data)
      )

      navigate('/')

    } catch (error) {
      setError('Invalid Email or Password')
    }
  }

  
  const handleBiometricLogin = async () => {
    setError('')
    
    if (!formData.email) {
      setError('Please type your registered email address first to look up your passkey.')
      return
    }

    setBioLoading(true)
    const result = await loginWithBiometrics(formData.email)
    setBioLoading(false)

    if (result.success && result.user) {
      
      localStorage.setItem('user', JSON.stringify(result.user))
      navigate('/')
    } else {
      setError(result.error || 'Biometric authentication failed')
    }
  }

  return (
    <div className='login-page'>
      <div className='login-container'>

        {/* LEFT */}
        <div className='login-left'>
          <div className='bank-icon'>
            <FaUniversity />
          </div>

          {/* DYNAMIC GREETING RENDERED HERE */}
          <h1>{getGreeting()}</h1>

          <p>
            Securely access your
            Smart Bank dashboard
          </p>
        </div>

        {/* RIGHT */}
        <div className='login-right'>
          <h2 className='login-title'>
            Login Account
          </h2>

          <p className='login-subtitle'>
            Enter your credentials
            to continue
          </p>

          {error && (
            <p className='login-error'>
              {error}
            </p>
          )}

          <form onSubmit={handleLogin}>
            {/* EMAIL */}
            <div className='input-group'>
              <label>Email</label>
              <div className='input-box'>
                <FaEnvelope />
                <input
                  type='email'
                  name='email'
                  placeholder='Enter your email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className='input-group'>
              <label>Password</label>
              <div className='input-box'>
                <FaLock />
                <input
                  type='password'
                  name='password'
                  placeholder='Enter your password'
                  value={formData.password}
                  onChange={handleChange}
                  required={!bioLoading} 
                />
              </div>
            </div>

            <button
              type='submit'
              className='login-btn'
              style={{ marginBottom: '12px' }}
            >
              Login with Password
            </button>
          </form>

          {/* 🔐 BACKUP SEPARATE ELEMENT: Professional secondary alternative path button */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0', width: '100%' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
            <span style={{ padding: '0 10px', color: '#94a3b8', fontSize: '12px' }}>OR</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
          </div>

          <button
            type='button'
            onClick={handleBiometricLogin}
            disabled={bioLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: bioLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
              opacity: bioLoading ? 0.7 : 1
            }}
          >
            <FaFingerprint />
            {bioLoading ? 'Authenticating...' : 'Sign In with Passkey'}
          </button>

        </div>
      </div>
    </div>
  )
}

export default Login
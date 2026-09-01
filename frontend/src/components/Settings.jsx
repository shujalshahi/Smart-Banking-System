import React, { useState } from 'react'
import API from '../services/api'
import { FaLock, FaKey } from 'react-icons/fa'
import '../styles/settings.css' 

const Settings = () => {
  const currentUser = JSON.parse(localStorage.getItem('user')) || null

 
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmNewPin: ''
  })

  
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
  }

  const handlePinChange = (e) => {
    setPinData({ ...pinData, [e.target.name]: e.target.value })
  }

  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!currentUser?._id) {
      alert('❌ Error: User session context not found. Please log in again.')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      alert('❌ Error: New passwords do not match.')
      return
    }

    try {
      const response = await API.put('/auth/update-password', {
        userId: currentUser._id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      alert(response.data.message || 'Password changed successfully! 🎉')
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || 'Failed to update login password.')
    }
  }

  const handlePinSubmit = async (e) => {
    e.preventDefault()

    if (!currentUser?._id) {
      alert('❌ Error: User session context not found. Please log in again.')
      return
    }

    if (pinData.newPin !== pinData.confirmNewPin) {
      alert('❌ Error: New PIN entries do not match.')
      return
    }

    if (pinData.newPin.length !== 4 || isNaN(Number(pinData.newPin))) {
      alert('❌ Error: Transaction PIN must be exactly 4 digits.')
      return
    }

    try {
      const response = await API.put('/auth/update-pin', {
        userId: currentUser._id,
        currentPin: pinData.currentPin,
        newPin: pinData.newPin
      })

      alert(response.data.message || 'Transaction PIN updated successfully! 🔒')
      setPinData({ currentPin: '', newPin: '', confirmNewPin: '' })
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || 'Failed to update transaction PIN.')
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Security Settings</h1>
        <p className="settings-subtitle">Manage account authorization credentials and credentials personalization parameters</p>
      </div>

      <div className="settings-container">
        <div className="settings-card">
          <div className="card-header-icon pass-icon">
            <FaKey />
          </div>
          <h2>Update Account Password</h2>
          <p>Modify the password configuration used to gain operational entrance to this online banking terminal session profile.</p>
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="settings-input-group">
              <label>Current Login Password</label>
              <input 
                type="password" 
                name="currentPassword"
                placeholder="••••••••"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="settings-input-group">
              <label>New Password String</label>
              <input 
                type="password" 
                name="newPassword"
                placeholder="Minimum safe length pattern"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="settings-input-group">
              <label>Confirm New Password String</label>
              <input 
                type="password" 
                name="confirmNewPassword"
                placeholder="Re-type new credentials"
                value={passwordData.confirmNewPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <button type="submit" className="settings-submit-btn pass-btn">Save New Password</button>
          </form>
        </div>

        
        <div className="settings-card">
          <div className="card-header-icon pin-icon">
            <FaLock />
          </div>
          <h2>Change Transaction PIN</h2>
          <p>Personalize the numeric validation asset required to authorize financial wire transfers and settle banking asset conversions.</p>
          
          <form onSubmit={handlePinSubmit}>
            <div className="settings-input-group">
              <label>Current 4-Digit PIN Code</label>
              <input 
                type="password" 
                name="currentPin"
                maxLength={4}
                placeholder="••••"
                value={pinData.currentPin}
                onChange={handlePinChange}
                required
              />
            </div>
            <div className="settings-input-group">
              <label>New Secret 4-Digit PIN Code</label>
              <input 
                type="password" 
                name="newPin"
                maxLength={4}
                placeholder="••••"
                value={pinData.newPin}
                onChange={handlePinChange}
                required
              />
            </div>
            <div className="settings-input-group">
              <label>Confirm Secret 4-Digit PIN Code</label>
              <input 
                type="password" 
                name="confirmNewPin"
                maxLength={4}
                placeholder="••••"
                value={pinData.confirmNewPin}
                onChange={handlePinChange}
                required
              />
            </div>
            <button type="submit" className="settings-submit-btn pin-btn">Authorize New PIN</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Settings
import React, { useEffect, useState } from 'react'
import API from '../services/api' 
import '../styles/navbar.css'
import {
  FaBell,
  FaChevronDown,
  FaSignOutAlt,
  FaCamera,
  FaEnvelope,
  FaExclamationTriangle
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    _id: '',
    name: '',
    role: '',
    email: '',
    image: ''
  })
  const [notifications, setNotifications] = useState([]) 
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isUpdatingImage, setIsUpdatingImage] = useState(false)
  
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (storedUser) {
      setUser(storedUser)
      fetchNotifications(storedUser)
    }
  }, [])

  const fetchNotifications = async (currentUser) => {
    try {
      const response = await API.get('/transactions')
      let alerts = []

      if (currentUser?.role?.toLowerCase() === 'customer') {
        const myTransactions = response.data.filter(
          (tx) => 
            tx.sender?.toLowerCase() === currentUser.name?.toLowerCase() || 
            tx.receiver?.toLowerCase() === currentUser.name?.toLowerCase()
        )
        alerts = myTransactions.slice(-5).reverse().map(tx => {
          const isSender = tx.sender?.toLowerCase() === currentUser.name?.toLowerCase()
          return {
            id: tx._id || tx.id,
            message: isSender 
              ? `Sent Rs. ${Number(tx.amount).toLocaleString('en-IN')} to ${tx.receiver}`
              : `Received Rs. ${Number(tx.amount).toLocaleString('en-IN')} from ${tx.sender}`,
            date: tx.date || 'Just now',
            // Get timestamp reliably from createdAt, date, or current time
            timestamp: new Date(tx.createdAt || tx.date || Date.now()).getTime()
          }
        })
      } else {
        alerts = response.data.slice(-5).reverse().map(tx => ({
          id: tx._id || tx.id,
          message: `${tx.sender} transferred Rs. ${Number(tx.amount).toLocaleString('en-IN')} to ${tx.receiver}`,
          date: tx.date || 'Recent',
          timestamp: new Date(tx.createdAt || tx.date || Date.now()).getTime()
        }))
      }

      setNotifications(alerts)

      
      if (alerts.length > 0) {
        const lastReadTime = localStorage.getItem(`lastRead_${currentUser._id}`)

        if (!lastReadTime) {
          setHasUnread(true)
        } else {
          const newestNotificationTime = alerts[0].timestamp

          if (newestNotificationTime > Number(lastReadTime)) {
            setHasUnread(true)
          } else {
            setHasUnread(false)
          }
        }
      } else {
        setHasUnread(false)
      }
    } catch (error) {
      console.error('Error fetching layout notifications:', error)
    }
  }

  const handleBellClick = () => {
    const nextState = !showNotificationDropdown
    setShowNotificationDropdown(nextState)

    if (nextState) {
      setHasUnread(false)
      
      if (user?._id) {
        localStorage.setItem(`lastRead_${user._id}`, Date.now().toString())
      }
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 1.5 * 1024 * 1024) {
      alert("⚠️ File too large! Please choose an image smaller than 1.5MB to ensure system stability.")
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = async () => {
      const base64String = reader.result 
      await uploadProfileImage(base64String)
    }
  }

  const uploadProfileImage = async (imageString) => {
    try {
      setIsUpdatingImage(true)
      
      const endpoint = user.role?.toLowerCase() === 'admin' 
        ? `/admins/${user._id}` 
        : `/customers/${user._id}`

      await API.put(endpoint, { image: imageString })

      const updatedUser = { ...user, image: imageString }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      alert('📸 Profile picture updated successfully!')
    } catch (error) {
      console.error('Failed to update image code structure:', error)
      alert('Failed to sync direct image updates with your server. Ensure your backend accepts large text payloads.')
    } finally {
      setIsUpdatingImage(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    navigate('/login')
  }

  const isAdmin = user.role?.toLowerCase() === 'admin'
  const fallbackAvatar = isAdmin ? 'https://cdn-icons-png.flaticon.com/512/2206/2206368.png' : '/customer.jpg'

  return (
    <nav className='navbar'>
      <div className='navbar-left'>
        <h2 className='logo' onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          SmartVault
        </h2>
      </div>

      <div className='navbar-right'>
        <div className='notification-wrapper' style={{ position: 'relative' }}>
          <div className='notification-icon' onClick={handleBellClick} style={{ cursor: 'pointer', position: 'relative' }}>
            <FaBell />
            {hasUnread && notifications.length > 0 && (
              <span className='notification-badge'>{notifications.length}</span>
            )}
          </div>

          {showNotificationDropdown && (
            <div className='notification-dropdown' style={{
              position: 'absolute', right: 0, top: '40px', backgroundColor: '#ffffff',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)', borderRadius: '8px',
              width: '280px', zIndex: 1000, padding: '10px 0', maxHeight: '350px', overflowY: 'auto'
            }}>
              <h4 style={{ padding: '0 15px 8px 15px', borderBottom: '1px solid #f1f5f9', margin: 0, color: '#334155' }}>Recent Activities</h4>
              {notifications.length === 0 ? (
                <p style={{ padding: '15px', color: '#64748b', fontSize: '13px', textAlign: 'center', margin: 0 }}>No new updates.</p>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} style={{ padding: '10px 15px', borderBottom: '1px solid #f8fafc', fontSize: '13px', color: '#475569' }}>
                    <p style={{ margin: '0 0 4px 0', lineHeight: '1.4' }}>{notif.message}</p>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{notif.date}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className='profile-wrapper'>
          <div className='profile-section' onClick={() => setShowDropdown(!showDropdown)}>
            <img src={user.image || fallbackAvatar} alt='Profile' className='profile-image' />
            <div className='profile-details profile-text-wrapper'>
              <h4>{user.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : 'Guest'}</h4>
              <p>{isAdmin ? 'System Admin' : 'Customer'}</p>
            </div>
            <FaChevronDown className='dropdown-icon' />
          </div>

          {showDropdown && (
            <div className='profile-dropdown' style={{ minWidth: '260px', padding: '16px' }}>
              <div className='dropdown-user-info' style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <img src={user.image || fallbackAvatar} alt='Profile' style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h4 style={{ margin: 0 }}>{user.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : 'Guest'}</h4>
                  <p style={{ textTransform: 'capitalize', margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{user.role || 'Guest'}</p>
                </div>
              </div>

              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '6px', 
                fontSize: '12px', color: '#334155', marginBottom: '14px' 
              }}>
                <FaEnvelope style={{ color: '#64748b' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email || 'No email attached'}</span>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '0 0 12px 0' }} />

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Change Profile Photo
                </label>
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  backgroundColor: '#f1f5f9', color: '#334155', border: '1px dashed #cbd5e1',
                  padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500'
                }}>
                  <FaCamera style={{ color: '#64748b' }} />
                  {isUpdatingImage ? 'Processing...' : 'Upload Image File'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    disabled={isUpdatingImage}
                    style={{ display: 'none' }} 
                  />
                </label>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '6px', 
                  marginTop: '8px', 
                  backgroundColor: '#fffbeb', 
                  border: '1px solid #fde68a', 
                  padding: '8px', 
                  borderRadius: '6px' 
                }}>
                  <FaExclamationTriangle style={{ color: '#d97706', fontSize: '12px', marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '10.5px', color: '#b45309', lineHeight: '1.4', fontWeight: '500' }}>
                    <strong>Max size: 1.5MB.</strong> Please use compressed files to ensure optimal load times and prevent database capacity errors.
                  </p>
                </div>
              </div>

              <button className='logout-dropdown-btn' onClick={handleLogout} style={{ width: '100%' }}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
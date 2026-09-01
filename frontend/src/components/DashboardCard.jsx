import React from 'react'
import {
  FaUsers,
  FaCodeBranch,
  FaExchangeAlt,
  FaUserTie,
  FaWallet
} from 'react-icons/fa'

const DashboardCard = ({ title, value, icon }) => {
  const getIcon = () => {
    
    if (icon) return icon

    
    switch (title) {
      case 'Customers':
        return <FaUsers />

      case 'Branches':
        return <FaCodeBranch />

      case 'Transactions':
      case 'Your Total Transfers': 
        return <FaExchangeAlt />

      case 'Employees':
        return <FaUserTie />

      case 'Available Balance': 
        return <FaWallet />

      default:
        return null
    }
  }

  return (
    <div className='dashboard-card'>
      <div className='card-top'>
        <div className='card-icon'>
          {getIcon()}
        </div>
      </div>

      <div className='card-content'>
        <h3>{title}</h3>
        <h2>{value}</h2>
      </div>
    </div>
  )
}

export default DashboardCard
import React, { useEffect, useState } from 'react'
import API, { registerBiometrics } from '../services/api' 
import { useNavigate } from 'react-router-dom'
import DashboardCard from '../components/DashboardCard'

import { 
  FaArrowUp as FaUp, 
  FaArrowDown as FaDown, 
  FaWallet as FaWall, 
  FaExchangeAlt as FaEx, 
  FaDownload as FaDl, 
  FaFingerprint as FaFp 
} from 'react-icons/fa'

import '../styles/dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [branches, setBranches] = useState([]) 
  const [employees, setEmployees] = useState([]) 
  const [user, setUser] = useState(null)
  const [liveBalance, setLiveBalance] = useState(0) 
  const [downloadingId, setDownloadingId] = useState(null) 
  const [biometricLoading, setBiometricLoading] = useState(false)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    setUser(storedUser)
    
    if (storedUser) {
      fetchDashboardData(storedUser)
    }
  }, [])

  const fetchDashboardData = async (currentUser) => {
    try {
      const transactionResponse = await API.get('/transactions')
      
      if (currentUser?.role?.toLowerCase() === 'customer') {
        const filtered = transactionResponse.data.filter(
          (tx) => 
            tx.sender?.toLowerCase() === currentUser.name?.toLowerCase() || 
            tx.receiver?.toLowerCase() === currentUser.name?.toLowerCase()
        )
        setTransactions(filtered)

        const userProfileResponse = await API.get(`/customers/${currentUser._id}`)

        if (userProfileResponse.data) {
          const freshBalance = userProfileResponse.data.balance !== undefined ? userProfileResponse.data.balance : 0
          setLiveBalance(freshBalance)
        }
      } else {
        setTransactions(transactionResponse.data)
        
        // Fetch Admin metrics in parallel
        const [customerResponse, branchResponse, employeeResponse] = await Promise.all([
          API.get('/customers'),
          API.get('/branches'),
          API.get('/employees') 
        ])
        
        setCustomers(customerResponse.data)
        setBranches(branchResponse.data)
        setEmployees(employeeResponse.data) 
      }
    } catch (error) {
      console.log('Error fetching dashboard layout metrics:', error)
    }
  }

  const handleEnableBiometrics = async () => {
    if (!user?._id) return;
    
    setBiometricLoading(true);
    const result = await registerBiometrics(user._id);
    setBiometricLoading(false);

    if (result.success) {
      alert('🎉 Biometric login linked successfully! You can now sign in using your face or fingerprint.');
      
      const updatedUser = { ...user, hasBiometrics: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      alert(`Setup incomplete: ${result.error}`);
    }
  };

  const downloadPDFStatement = async (transactionId) => {
    try {
      setDownloadingId(transactionId) 

      const response = await API.get(`/transactions/${transactionId}/download-statement`, {
        responseType: 'blob' 
      })

      const fileBlob = new Blob([response.data], { type: 'application/pdf' })
      const nativeUrl = window.URL.createObjectURL(fileBlob)
      
      const phantomLink = document.createElement('a')
      phantomLink.href = nativeUrl
      phantomLink.setAttribute('download', `Receipt-${transactionId?.slice(-6)}.pdf`)
      document.body.appendChild(phantomLink)
      phantomLink.click()
      
      phantomLink.parentNode.removeChild(phantomLink)
      window.URL.revokeObjectURL(nativeUrl)
    } catch (error) {
      console.error('PDF Frontend Error context:', error)
      alert('Could not compile download verification file. Please check backend environment configuration logs.')
    } finally {
      setDownloadingId(null) 
    }
  }

  const isAdmin = user?.role?.toLowerCase() === 'admin'

  const formatCurrencyValue = (rawValue) => {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return 'Rs. 0'
    }
    
    if (typeof rawValue === 'number' && !isNaN(rawValue)) {
      return `Rs. ${rawValue.toLocaleString('en-IN')}`
    }
    
    if (typeof rawValue === 'string') {
      const numericString = rawValue.replace(/[^\d.]/g, '') 
      const parsedNumber = Number(numericString)
      
      return !isNaN(parsedNumber) && numericString !== ''
        ? `Rs. ${parsedNumber.toLocaleString('en-IN')}`
        : `Rs. ${rawValue}` 
    }

    return `Rs. ${rawValue}`
  }

  
  const calculateMetrics = () => {
    if (!transactions || transactions.length === 0) {
      return { income: 0, expenses: 0, growth: '+0%' }
    }

    const currentUserName = user?.name?.toLowerCase()

    if (!isAdmin) {
      const totalIncome = transactions
        .filter((tx) => tx.receiver?.toLowerCase() === currentUserName)
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

      const totalExpenses = transactions
        .filter((tx) => tx.sender?.toLowerCase() === currentUserName)
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

      return { income: totalIncome, expenses: totalExpenses }
    } else {
      const totalVolume = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
      const recentTxns = transactions.slice(-5)
      const recentVolume = recentTxns.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
      const growthRate = totalVolume > 0 ? Math.round((recentVolume / totalVolume) * 100) : 0

      return {
        totalVolume,
        growth: `+${growthRate}% Active Volume`
      }
    }
  }

  const metrics = calculateMetrics()

  return (
    <div className='dashboard-page'>
      {/* HEADER */}
      <div className='dashboard-header'>
        <div>
          <h1 className='dashboard-title'>
            Welcome Back 👋
            {user?.name && ` ${user.name.charAt(0).toUpperCase() + user.name.slice(1)}`}
          </h1>
          <p className='dashboard-subtitle'>
            {isAdmin 
              ? 'Monitor your banking system performance' 
              : 'Manage your personal secure savings account state'
            }
          </p>
        </div>

        {/* 🟢 DYNAMICALLY COMPUTED STATUS BADGES */}
        <div className='dashboard-status'>
          {isAdmin ? (
            <div className='status-box income'>
              <FaUp />
              <span>{metrics.growth}</span>
            </div>
          ) : (
            <>
              <div className='status-box income' title="Total Money Received">
                <FaUp />
                <span>+Rs. {metrics.income.toLocaleString('en-IN')} Received</span>
              </div>
              <div className='status-box expense' title="Total Money Sent">
                <FaDown />
                <span>-Rs. {metrics.expenses.toLocaleString('en-IN')} Sent</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BIOMETRIC ACTIVATION BANNER FOR CUSTOMERS */}
      {!isAdmin && user && !user.hasBiometrics && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          color: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaFp /> Enable Biometric Secure Login
            </h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              Tired of passwords? Secure your banking platform profile by mapping your device's local hardware fingerprint scanner or Face ID interface.
            </p>
          </div>
          <button 
            onClick={handleEnableBiometrics}
            disabled={biometricLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffffff',
              color: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: biometricLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              transition: 'transform 0.1s',
              opacity: biometricLoading ? 0.7 : 1
            }}
          >
            {biometricLoading ? 'Configuring System...' : 'Link My Device'}
          </button>
        </div>
      )}

      {/* DYNAMIC GRID SYSTEM */}
      <div className='dashboard-grid'>
        {isAdmin ? (
          <>
            <DashboardCard title='Customers' value={customers.length} />
            <DashboardCard title='Branches' value={branches.length} />
            <DashboardCard title='Transactions' value={transactions.length} />
            <DashboardCard title='Employees' value={employees.length} />
          </>
        ) : (
          <>
            <DashboardCard 
              title='Available Balance' 
              value={formatCurrencyValue(liveBalance)} 
              icon={<FaWall />}
            />
            <DashboardCard 
              title='Your Total Transfers' 
              value={transactions.length} 
              icon={<FaEx />}
            />
          </>
        )}
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className='recent-transactions'>
        <div className='section-header'>
          <h2>{isAdmin ? 'Global System Transactions' : 'Your Personal Transaction Ledger'}</h2>
          <button onClick={() => navigate('/transactions')}>
            View All
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Receipt</th> 
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                  No transaction history recorded yet.
                </td>
              </tr>
            ) : (
              transactions
                .slice(-5)
                .reverse()
                .map((item) => {
                  const currentId = item._id || item.id;
                  return (
                    <tr key={currentId}>
                      <td>#{currentId?.slice(-6)}</td>
                      <td>{item.sender}</td>
                      <td>{item.receiver}</td>
                      <td>{formatCurrencyValue(item.amount)}</td>
                      <td>
                        <span className={item.status === 'Success' ? 'success-status' : 'pending-status'}>
                          {item.status}
                        </span>
                      </td>
                      
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => downloadPDFStatement(currentId)}
                          disabled={downloadingId === currentId}
                          title="Download Statement Document"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: downloadingId === currentId ? '#94a3b8' : '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: downloadingId === currentId ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <FaDl />
                          {downloadingId === currentId ? '...' : 'PDF'}
                        </button>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard
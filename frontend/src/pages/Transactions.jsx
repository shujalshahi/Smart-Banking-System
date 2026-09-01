import React, { useEffect, useState, useRef } from 'react'
import API from '../services/api'

import {
  FaExchangeAlt,
  FaSearch,
  FaTimes,
  FaEdit,
  FaTrash,
  FaDownload,
  FaLock
} from 'react-icons/fa'

import '../styles/transactions.css'

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [customers, setCustomers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  
  const [showPinModal, setShowPinModal] = useState(false)
  const [enteredPin, setEnteredPin] = useState('')
  const pinInputRef = useRef(null)

  
  const currentUserInfo = JSON.parse(localStorage.getItem('user')) || {}
  const isCustomer = currentUserInfo?.role === 'customer'
  const currentUserName = currentUserInfo?.name || ''

  const [formData, setFormData] = useState({
    sender: isCustomer ? currentUserName : '',
    receiver: '',
    amount: '',
    type: 'Debit',
  })

  useEffect(() => {
    fetchPageData()
  }, [])

  
  useEffect(() => {
    if (showPinModal && pinInputRef.current) {
      pinInputRef.current.focus()
    }
  }, [showPinModal])

  const fetchPageData = async () => {
    try {
      const [transactionResponse, customerResponse] = await Promise.all([
        API.get('/transactions'),
        API.get('/customers')
      ])

      setTransactions(transactionResponse.data || [])
      setCustomers(customerResponse.data || [])
    } catch (error) {
      console.error('Error loading page data:', error)
    }
  }

  const downloadPDFStatement = async (transactionId) => {
    try {
      setDownloadingId(transactionId)

      const response = await API.get(`/transactions/${transactionId}/download-statement`, {
        responseType: 'blob'
      })

      const fileBlob = new Blob([response.data], { type: 'application/pdf' })
      const nativeBlobUrl = window.URL.createObjectURL(fileBlob)

      const phantomLink = document.createElement('a')
      phantomLink.href = nativeBlobUrl
      phantomLink.setAttribute('download', `Receipt-${transactionId?.slice(-5)}.pdf`)
      document.body.appendChild(phantomLink)
      phantomLink.click()

      document.body.removeChild(phantomLink)
      window.URL.revokeObjectURL(nativeBlobUrl)
    } catch (error) {
      console.error('PDF Download Error context:', error)
      alert('Could not pull generated ledger data sheet from your banking ecosystem backend server.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  
  const handleSubmitFormWithPinGate = (e) => {
    e.preventDefault()

    const dynamicSender = isCustomer ? currentUserName : formData.sender

    if (!dynamicSender) {
      alert("❌ Error: Please select or enter a valid transaction sender.")
      return
    }

    if (formData.receiver && dynamicSender.toLowerCase() === formData.receiver.toLowerCase()) {
      alert("❌ Transaction Rejected: You cannot transfer assets to the same account profile.")
      return
    }

    const transferAmount = Number(formData.amount)
    const senderCustomer = customers.find(c => c.name?.toLowerCase() === dynamicSender.toLowerCase())
    const senderOldBal = senderCustomer && senderCustomer.balance
      ? Number(String(senderCustomer.balance).replace(/[^0-9.]/g, "")) || 0
      : 0

    if (formData.type === 'Debit' && !editingId) {
      if (!senderCustomer) {
        alert("❌ Error: Please select a valid registered sender from the dropdown menu.")
        return
      }
      if (transferAmount > senderOldBal) {
        alert(`❌ Transaction Denied: Insufficient Funds!\n\n${dynamicSender} only has Rs. ${senderOldBal.toLocaleString('en-IN')} available.`)
        return
      }
    }

    
    if (!editingId) {
      setShowModal(false) // Closes form panel
      setEnteredPin('')
      setShowPinModal(true) // Opens PIN prompt
    } else {
      executeTransactionAPI()
    }
  }

  
  const executeTransactionAPI = async (pinValue = enteredPin) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const dynamicSender = isCustomer ? currentUserName : formData.sender

    try {
      const transactionData = {
        sender: dynamicSender,
        receiver: formData.receiver,
        amount: String(formData.amount),
        type: formData.type,
        status: 'Success',
        pin: pinValue,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      }

      if (editingId) {
        await API.put(`/transactions/${editingId}`, transactionData)
      } else {
        const response = await API.post('/transactions', transactionData)
        alert(response.data?.message || "Transaction Completed Successfully!")
      }

      await fetchPageData()

      // Reset state cleanly
      setFormData({
        sender: isCustomer ? currentUserName : '',
        receiver: '',
        amount: '',
        type: 'Debit'
      })
      setEditingId(null)
      setShowPinModal(false)
      setEnteredPin('')
      setShowModal(false)
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || "Transaction pipeline execution rejected by banking middleware layer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction log?")) return
    try {
      await API.delete(`/transactions/${id}`)
      fetchPageData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = (item) => {
    setEditingId(item._id)
    const numbersOnly = String(item.amount).replace(/[^0-9.]/g, "")
    setFormData({
      sender: item.sender,
      receiver: item.receiver,
      amount: numbersOnly,
      type: item.type,
    })
    setShowModal(true)
  }

  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch = item.sender ? item.sender.toLowerCase().includes(search.toLowerCase()) : false
    if (isCustomer) {
      const targetUser = currentUserName.toLowerCase()
      const involvesMe = (item.sender?.toLowerCase() === targetUser) || (item.receiver?.toLowerCase() === targetUser)
      return involvesMe && (search ? matchesSearch : true)
    }
    return matchesSearch
  })

  // Dynamic filter for receiver dropdown to prevent sending money to the same sender
  const currentSelectedSender = isCustomer ? currentUserName : formData.sender

  return (
    <div className='transactions-page'>
      <div className='transactions-header'>
        <div>
          <h1 className='transactions-title'>Transactions</h1>
          <p className='transactions-subtitle'>Monitor all banking transactions</p>
        </div>

        <button
          className='new-transaction-btn'
          onClick={() => {
            setShowModal(true)
            setEditingId(null)
            setFormData({
              sender: isCustomer ? currentUserName : '',
              receiver: '',
              amount: '',
              type: 'Debit'
            })
          }}
        >
          + New Transaction
        </button>
      </div>

      <div className='transactions-stats'>
        <div className='transaction-card'>
          <div className='transaction-icon total-icon'>
            <FaExchangeAlt />
          </div>
          <div>
            <h3>Total Transactions</h3>
            <h2>{filteredTransactions.length}</h2>
          </div>
        </div>
      </div>

      <div className='transaction-search'>
        <FaSearch />
        <input
          type='text'
          placeholder='Search transactions...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className='transactions-table-container'>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ minWidth: isCustomer ? '60px' : '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                  No transaction records found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((item) => {
                const pureAmount = Number(String(item.amount).replace(/[^0-9.]/g, "")) || 0
                return (
                  <tr key={item._id}>
                    <td>{item._id ? item._id.slice(-5) : 'N/A'}</td>
                    <td>{item.sender}</td>
                    <td>{item.receiver || 'N/A'}</td>
                    <td>Rs. {pureAmount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={item.type === 'Credit' ? 'credit-badge' : 'debit-badge'}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${item.status ? item.status.toLowerCase() : 'success'}`}>
                        {item.status || 'Success'}
                      </span>
                    </td>
                    <td>{item.date}</td>
                    <td>
                      <div className='transaction-actions'>
                        <button
                          className='transaction-download-btn'
                          onClick={() => downloadPDFStatement(item._id)}
                          disabled={downloadingId === item._id}
                          title="Download Statement E-Receipt"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: downloadingId === item._id ? '#94a3b8' : '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: downloadingId === item._id ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          {downloadingId === item._id ? '...' : <FaDownload />}
                        </button>

                        {!isCustomer && (
                          <>
                            <button className='transaction-edit-btn' onClick={() => handleEdit(item)}>
                              <FaEdit />
                            </button>
                            <button className='transaction-delete-btn' onClick={() => handleDelete(item._id)}>
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className='transaction-modal-overlay'>
          <div className='transaction-modal'>
            <div className='transaction-modal-header'>
              <h2>{editingId ? 'Edit Transaction' : 'New Transaction'}</h2>
              <button className='close-transaction-modal' onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitFormWithPinGate}>
              <div className='transaction-input-group'>
                <label>Sender Name</label>
                <select
                  name='sender'
                  value={isCustomer ? currentUserName : formData.sender}
                  onChange={handleChange}
                  required
                  disabled={isCustomer || !!editingId}
                >
                  {isCustomer ? (
                    <option value={currentUserName}>{currentUserName}</option>
                  ) : (
                    <>
                      <option value=''>-- Select Database Customer --</option>
                      {customers.map((cust) => {
                        const cleanCustBal = Number(String(cust.balance).replace(/[^0-9.]/g, "")) || 0
                        return (
                          <option key={cust._id} value={cust.name}>
                            {cust.name} (Available: Rs. {cleanCustBal.toLocaleString('en-IN')})
                          </option>
                        )
                      })}
                    </>
                  )}
                </select>
              </div>

              <div className='transaction-input-group'>
                <label>Receiver Name</label>
                <select
                  name='receiver'
                  value={formData.receiver}
                  onChange={handleChange}
                  required={formData.type === 'Debit'}
                >
                  <option value=''>-- Select Database Customer --</option>
                  {customers
                    .filter(cust => cust.name?.toLowerCase() !== currentSelectedSender?.toLowerCase())
                    .map((cust) => (
                      <option key={cust._id} value={cust.name}>
                        {cust.name}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className='transaction-input-group'>
                <label>Amount (in Rs.)</label>
                <input
                  type='number'
                  name='amount'
                  placeholder='e.g. 15000'
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>

              <div className='transaction-input-group'>
                <label>Transaction Type</label>
                <select
                  name='type'
                  value={formData.type}
                  onChange={handleChange}
                  disabled={isCustomer}
                >
                  <option value='Debit'>Debit </option>
                  <option value='Credit'>Credit </option>
                </select>
              </div>

              <button type='submit' className='save-transaction-btn' disabled={isSubmitting}>
                {editingId ? 'Update Log' : 'Authorize Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      
      {showPinModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 4000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff', padding: '30px 25px', borderRadius: '12px',
            textAlign: 'center', width: '320px', boxShadow: '0px 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ color: '#ef4444', fontSize: '28px', marginBottom: '12px' }}>
              <FaLock />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '18px' }}>Security Verification</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.4' }}>
              Please type your 4-digit secret authorization PIN to authenticate this transfer request.
            </p>

            <input
              ref={pinInputRef}
              type="password"
              maxLength={4}
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              style={{
                letterSpacing: '12px', textAlign: 'center', fontSize: '24px',
                padding: '10px', width: '80%', margin: '0 auto 25px auto',
                display: 'block', border: '2px solid #cbd5e1', borderRadius: '6px',
                outline: 'none', color: '#1e293b'
              }}
              placeholder="••••"
            />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false)
                  setEnteredPin('')
                  setShowModal(true) // Re-opens form modal so user can adjust inputs
                }}
                disabled={isSubmitting}
                style={{
                  background: '#f1f5f9', color: '#475569', border: 'none',
                  padding: '10px 18px', borderRadius: '6px', cursor: 'pointer',
                  fontWeight: '500', flex: 1
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeTransactionAPI(enteredPin)}
                disabled={enteredPin.length < 4 || isSubmitting}
                style={{
                  background: (enteredPin.length < 4 || isSubmitting) ? '#94a3b8' : '#16a34a',
                  color: '#ffffff', border: 'none', padding: '10px 18px',
                  borderRadius: '6px', cursor: (enteredPin.length < 4 || isSubmitting) ? 'not-allowed' : 'pointer',
                  fontWeight: '500', flex: 1, transition: 'background-color 0.2s'
                }}
              >
                {isSubmitting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions
import React, { useEffect, useState } from 'react'
import API from '../services/api' 
import { FaUsers, FaSearch, FaEdit, FaTrash, FaTimes, FaBuilding } from 'react-icons/fa'
import '../styles/customers.css'

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [branches, setBranches] = useState([]) 
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    branch: '', 
    password: '',
    balance: '',
    transactionPin: '' 
  })

  useEffect(() => {
    fetchPageData()
  }, [])

  // 1. FETCH CUSTOMERS AND BRANCHES
  const fetchPageData = async () => {
    try {
      const [custRes, branchRes] = await Promise.all([
        API.get('/customers'),
        API.get('/branches')
      ])
      setCustomers(custRes.data || [])
      setBranches(branchRes.data || [])
    } catch (error) {
      console.log('Error fetching data:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (!formData.name || !formData.email || !formData.branch) {
        alert('Please fill all required fields, including selecting a branch.')
        return
      }

      if (editingId) {
        // Updates existing customer record
        await API.put(`/customers/${editingId}`, {
          name: formData.name,
          email: formData.email,
          branch: formData.branch
        })
      } else {
        // Registers a new customer record
        await API.post('/customers', {
          name: formData.name,
          email: formData.email,
          branch: formData.branch,
          password: formData.password || 'customer123', 
          role: 'customer',
          balance: formData.balance, 
          transactionPin: formData.transactionPin || '1234' 
        })
      }

      fetchPageData() 
      setShowModal(false)
      setEditingId(null)
      setFormData({ name: '', email: '', branch: '', password: '', balance: '', transactionPin: '' }) 
    } catch (error) {
      console.log(error)
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message)
      } else {
        alert('Customer not saved')
      }
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await API.delete(`/customers/${id}`)
      fetchPageData() 
    } catch (error) {
      console.log(error)
    }
  }

  const handleEdit = (customer) => {
    setEditingId(customer._id)
    setFormData({
      name: customer.name,
      email: customer.email,
      branch: customer.branch || '',
      password: '', 
      balance: customer.balance || '',
      transactionPin: '' 
    })
    setShowModal(true)
  }

  const filteredCustomers = customers.filter((item) =>
    item.name ? item.name.toLowerCase().includes(search.toLowerCase()) : false
  )

  return (
    <div className='customers-page'>
      <div className='customers-header'>
        <div>
          <h1 className='customers-title'>Customers</h1>
          <p className='customers-subtitle'>Manage customer accounts</p>
        </div>

        <button
          className='add-customer-btn'
          onClick={() => {
            setShowModal(true)
            setEditingId(null)
            setFormData({ name: '', email: '', branch: '', password: '', balance: '', transactionPin: '' })
          }}
        >
          + Add Customer
        </button>
      </div>

      <div className='customer-stats-card'>
        <div className='stats-icon'>
          <FaUsers />
        </div>
        <div>
          <h3>Total Customers</h3>
          <h2>{customers.length}</h2>
        </div>
      </div>

      <div className='search-box'>
        <FaSearch />
        <input
          type='text'
          placeholder='Search customers...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className='customers-table-container'>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Branch</th> {/* 👈 Added Branch Column */}
              <th>Balance</th> 
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer._id}>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.branch || 'N/A'}</td> {/* 👈 Displays Assigned Branch */}
                <td>Rs. {Number(customer.balance || 0).toLocaleString('en-IN')}</td>
                <td>
                  <div className='action-buttons'>
                    <button className='edit-btn' onClick={() => handleEdit(customer)}>
                      <FaEdit />
                    </button>
                    <button className='delete-btn' onClick={() => handleDelete(customer._id)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className='customer-modal-overlay'>
          <div className='customer-modal'>
            <div className='modal-header'>
              <h2>{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className='close-modal-btn' onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className='modal-input-group'>
                <label>Name</label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className='modal-input-group'>
                <label>Email</label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* 🏦 ASSIGN BRANCH DROPDOWN */}
              <div className='modal-input-group'>
                <label>Assign Branch</label>
                <select
                  name='branch'
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value=''>-- Select Bank Branch --</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b.branch}>
                      {b.branch} ({b.location})
                    </option>
                  ))}
                </select>
              </div>

              {!editingId && (
                <div className='modal-input-group'>
                  <label>Starting Balance (in Rs.)</label>
                  <input
                    type='number'
                    name='balance'
                    placeholder='e.g. 25000 (Leave blank for Rs. 0)'
                    value={formData.balance}
                    onChange={handleChange}
                  />
                  <small style={{ color: '#da8a13', fontSize: '12px', marginTop: '5px', display: 'block', lineHeight: '1.4' }}>
                    💡 <strong>Reminder:</strong> Please verify the initial amount. Leaving this blank initializes this user account profile with <strong>Rs. 0</strong>.
                  </small>
                </div>
              )}

              {!editingId && (
                <div className='modal-input-group'>
                  <label>Password</label>
                  <input
                    type='text'
                    name='password'
                    placeholder='Create custom password'
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              {!editingId && (
                <div className='modal-input-group'>
                  <label>Initial Transaction PIN (4 Digits)</label>
                  <input
                    type='text'
                    name='transactionPin'
                    maxLength={4}
                    placeholder='e.g. 4829 (Leave blank for 1234)'
                    value={formData.transactionPin}
                    onChange={handleChange}
                  />
                  <small style={{ color: '#64748b', fontSize: '12px', marginTop: '5px', display: 'block', lineHeight: '1.4' }}>
                    🔒 This setup generates a temporary verification security signature. If left unconfigured, it defaults to <strong>1234</strong>.
                  </small>
                </div>
              )}

              <button type='submit' className='save-customer-btn'>
                {editingId ? 'Update Customer' : 'Save Customer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
import React, { useEffect, useState } from 'react'
import API from '../services/api' 
import { FaMapMarkerAlt, FaPhoneAlt, FaUserTie, FaBuilding, FaTimes, FaEnvelope, FaTrash, FaEdit, FaPlus } from 'react-icons/fa'
import '../styles/branches.css'

const Branches = () => {
  const [branches, setBranches] = useState([])
  const [employees, setEmployees] = useState([]) 
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const [formData, setFormData] = useState({
    _id: '',
    branch: '',
    manager: '',
    phone: '',
    location: '',
    email: ''
  })

  useEffect(() => {
    fetchPageData()
  }, [])

  
  const fetchPageData = async () => {
    try {
      const [branchRes, empRes] = await Promise.all([
        API.get('/branches'),
        API.get('/employees')
      ])
      setBranches(branchRes.data || [])
      setEmployees(empRes.data || [])
    } catch (error) {
      console.log('Error loading data:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  
  const handleManagerSelect = (e) => {
    const selectedName = e.target.value;
    const selectedEmp = employees.find((emp) => emp.name === selectedName);

    if (selectedEmp) {
      setFormData((prev) => ({
        ...prev,
        manager: selectedEmp.name,
        phone: selectedEmp.phone || prev.phone,
        email: selectedEmp.email || prev.email
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        manager: selectedName
      }));
    }
  };

  
  const validateBranchData = () => {
    const { manager, phone, email, branch, location } = formData;

    if (!branch.trim() || !location.trim()) {
      alert("❌ Form Error: All text fields must be filled out completely.");
      return false;
    }

    if (!manager.trim()) {
      alert("❌ Validation Error: Please select a Manager.");
      return false;
    }

    const textOnlyRegex = /^[A-Za-z\s.]+$/;
    
    if (!textOnlyRegex.test(branch.trim())) {
      alert("❌ Validation Error: Branch Name must only contain letters, spaces, or periods.");
      return false;
    }

    if (!textOnlyRegex.test(manager.trim())) {
      alert("❌ Validation Error: Manager Name must only contain letters, spaces, or periods.");
      return false;
    }

    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      alert("❌ Validation Error: Please provide a valid 10-digit telephone contact number.");
      return false;
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert("❌ Validation Error: Please input a properly formatted email address.");
      return false;
    }

    return true;
  };

 
  const handleAddBranch = async (e) => {
    e.preventDefault()
    
    if (!validateBranchData()) return;

    try {
      await API.post('/branches', formData)
      fetchPageData()
      resetForm()
    } catch (error) {
      console.log(error)
    }
  }

  
  const handleDeleteBranch = async (id) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    try {
      await API.delete(`/branches/${id}`)
      fetchPageData()
    } catch (error) {
      console.log(error)
    }
  }

 
  const handleEditBranch = (branch) => {
    setFormData({
      _id: branch._id,
      branch: branch.branch,
      manager: branch.manager,
      phone: branch.phone,
      location: branch.location,
      email: branch.email
    })
    setShowModal(true)
    setIsEdit(true)
  }

  
  const handleUpdateBranch = async (e) => {
    e.preventDefault()

    if (!validateBranchData()) return;

    try {
      await API.put(`/branches/${formData._id}`, formData)
      fetchPageData()
      resetForm()
    } catch (error) {
      console.log(error)
    }
  }

  
  const resetForm = () => {
    setFormData({
      _id: '',
      branch: '',
      manager: '',
      phone: '',
      location: '',
      email: ''
    })
    setShowModal(false)
    setIsEdit(false)
  }

  return (
    <div className='branches-page'>
      {/* HEADER */}
      <div className='branches-header'>
        <div>
          <h1 className='branches-title'>Bank Branches</h1>
          <p className='branches-subtitle'>Manage and monitor all branch offices</p>
        </div>

        <button
          className='add-branch-btn'
          onClick={() => {
            setShowModal(true)
            setIsEdit(false)
          }}
        >
          <FaPlus />
          Add Branch
        </button>
      </div>

      
      <div className='branches-grid'>
        {branches.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#888' }}>
            No branches found in your database. Click "Add Branch" to create one!
          </div>
        ) : (
          branches.map((item) => (
            <div className='branch-card' key={item._id}>
              <div className='branch-icon'>
                <FaBuilding />
              </div>

              <h2>{item.branch}</h2>

              <div className='branch-details'>
                <p>
                  <FaUserTie />
                  <span>{item.manager}</span>
                </p>
                <p>
                  <FaPhoneAlt />
                  <span>{item.phone}</span>
                </p>
                <p>
                  <FaMapMarkerAlt />
                  <span>{item.location}</span>
                </p>
              </div>

              <div className='branch-actions'>
                <button
                  className='branch-btn'
                  onClick={() => setSelectedBranch(item)}
                >
                  View
                </button>

                <button
                  className='edit-branch-btn'
                  onClick={() => handleEditBranch(item)}
                >
                  <FaEdit />
                </button>

                <button
                  className='delete-branch-btn'
                  onClick={() => handleDeleteBranch(item._id)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      
      {selectedBranch && (
        <div className='branch-modal-overlay'>
          <div className='branch-modal'>
            <button
              className='close-branch-modal'
              onClick={() => setSelectedBranch(null)}
            >
              <FaTimes />
            </button>

            <div className='modal-top-icon'>
              <FaBuilding />
            </div>

            <h2>{selectedBranch.branch}</h2>

            <div className='modal-details'>
              <div className='modal-detail-item'>
                <FaUserTie />
                <div>
                  <h4>Branch Manager</h4>
                  <p>{selectedBranch.manager}</p>
                </div>
              </div>

              <div className='modal-detail-item'>
                <FaPhoneAlt />
                <div>
                  <h4>Contact Number</h4>
                  <p>{selectedBranch.phone}</p>
                </div>
              </div>

              <div className='modal-detail-item'>
                <FaEnvelope />
                <div>
                  <h4>Email Address</h4>
                  <p>{selectedBranch.email}</p>
                </div>
              </div>

              <div className='modal-detail-item'>
                <FaMapMarkerAlt />
                <div>
                  <h4>Branch Location</h4>
                  <p>{selectedBranch.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {showModal && (
        <div className='branch-modal-overlay'>
          <div className='branch-form-modal'>
            <div className='modal-header'>
              <h2>{isEdit ? 'Edit Branch' : 'Add Branch'}</h2>
              <button className='close-branch-modal' onClick={resetForm}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={isEdit ? handleUpdateBranch : handleAddBranch}>
              <input
                type='text'
                name='branch'
                placeholder='Branch Name'
                value={formData.branch}
                onChange={handleChange}
                required
              />

              
              <select
                name='manager'
                value={formData.manager}
                onChange={handleManagerSelect}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              >
                <option value=''>-- Select Branch Manager --</option>
                {employees
                  .filter((emp) => emp.role === 'Manager')
                  .map((emp) => (
                    <option key={emp._id} value={emp.name}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
              </select>

              <input
                type='text'
                name='phone'
                placeholder='Phone Number'
                value={formData.phone}
                onChange={handleChange}
                maxLength={10}
                required
              />

              <input
                type='text'
                name='location'
                placeholder='Location'
                value={formData.location}
                onChange={handleChange}
                required
              />

              <input
                type='email'
                name='email'
                placeholder='Email'
                value={formData.email}
                onChange={handleChange}
                required
              />

              <button type='submit' className='save-branch-btn'>
                {isEdit ? 'Update Branch' : 'Save Branch'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Branches
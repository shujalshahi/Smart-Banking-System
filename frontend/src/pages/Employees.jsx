import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { FaUserPlus, FaSearch, FaTimes, FaEdit, FaTrash, FaBuilding } from 'react-icons/fa';
import '../styles/employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Teller',
    branch: '',
    department: 'General Banking',
    phone: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      const [empRes, branchRes] = await Promise.all([
        API.get('/employees'),
        API.get('/branches')
      ]);
      setEmployees(empRes.data || []);
      setBranches(branchRes.data || []);
    } catch (error) {
      console.error('Failed to load page data:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //  FORM VALIDATION ROUTINE
  const validateEmployeeData = () => {
    const { name, email, phone, branch, department } = formData;

    
    if (!name.trim() || !department.trim()) {
      alert('❌ Validation Error: Please fill in all required text fields.');
      return false;
    }

    
    const textOnlyRegex = /^[A-Za-z\s.]+$/;
    if (!textOnlyRegex.test(name.trim())) {
      alert('❌ Validation Error: Employee Name must contain letters and spaces only. Numbers are not allowed.');
      return false;
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert('❌ Validation Error: Please enter a valid email address (e.g., user@domain.com).');
      return false;
    }

    
    if (!branch) {
      alert('❌ Validation Error: Please select an assigned bank branch.');
      return false;
    }

    
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      alert('❌ Validation Error: Phone number must be exactly 10 digits (e.g., 9800000000).');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    if (!validateEmployeeData()) return;

    setIsSubmitting(true);

    try {
      if (editingId) {
        await API.put(`/employees/${editingId}`, formData);
        alert('Employee updated successfully!');
      } else {
        await API.post('/employees', formData);
        alert('Employee added successfully!');
      }

      fetchPageData();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee._id);
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      branch: employee.branch?._id || employee.branch || '',
      department: employee.department || 'General Banking',
      phone: employee.phone || '',
      status: employee.status || 'Active'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await API.delete(`/employees/${id}`);
      fetchPageData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'Teller', branch: '', department: 'General Banking', phone: '', status: 'Active' });
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.email?.toLowerCase().includes(search.toLowerCase()) ||
    emp.role?.toLowerCase().includes(search.toLowerCase()) ||
    (emp.branch?.branch || emp.branch?.name)?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className='transactions-page'>
      <div className='transactions-header'>
        <div>
          <h1 className='transactions-title'>Employee Directory</h1>
          <p className='transactions-subtitle'>Manage internal bank staff and branch allocations</p>
        </div>

        <button className='new-transaction-btn' onClick={() => setShowModal(true)}>
          <FaUserPlus style={{ marginRight: '8px' }} /> Add New Employee
        </button>
      </div>

      <div className='transaction-search'>
        <FaSearch />
        <input
          type='text'
          placeholder='Search by name, role, email, or branch...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className='transactions-table-container'>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Assigned Branch</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                  No employee records found.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp._id}>
                  <td><strong>{emp.name}</strong></td>
                  <td>{emp.email}</td>
                  <td>{emp.role}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FaBuilding style={{ color: '#2563eb' }} />
                      {emp.branch?.branch || emp.branch?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td>{emp.department}</td>
                  <td>
                    <span className={emp.status === 'Active' ? 'credit-badge' : 'debit-badge'}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className='transaction-actions'>
                      <button className='transaction-edit-btn' onClick={() => handleEdit(emp)}>
                        <FaEdit />
                      </button>
                      <button className='transaction-delete-btn' onClick={() => handleDelete(emp._id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className='transaction-modal-overlay'>
          <div className='transaction-modal'>
            <div className='transaction-modal-header'>
              <h2>{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className='close-transaction-modal' onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className='transaction-input-group'>
                <label>Full Name</label>
                <input type='text' name='name' value={formData.name} onChange={handleChange} required placeholder='e.g. Jane Smith' />
              </div>

              <div className='transaction-input-group'>
                <label>Work Email</label>
                <input type='email' name='email' value={formData.email} onChange={handleChange} required placeholder='jane@bank.com' />
              </div>

              <div className='transaction-input-group'>
                <label>Job Role</label>
                <select name='role' value={formData.role} onChange={handleChange}>
                  <option value='Manager'>Manager</option>
                  <option value='Cashier'>Cashier</option>
                  <option value='Teller'>Teller</option>
                  <option value='Accountant'>Accountant</option>
                  <option value='Support'>Support</option>
                </select>
              </div>

              
              <div className='transaction-input-group'>
                <label>Assigned Branch</label>
                <select name='branch' value={formData.branch} onChange={handleChange} required>
                  <option value=''>-- Select Bank Branch --</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.branch} {b.location ? `(${b.location})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className='transaction-input-group'>
                <label>Department</label>
                <input type='text' name='department' value={formData.department} onChange={handleChange} placeholder='e.g. Operations' required />
              </div>

              <div className='transaction-input-group'>
                <label>Phone Number</label>
                <input 
                  type='text' 
                  name='phone' 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder='9800000000' 
                  maxLength={10} 
                  required 
                />
              </div>

              <div className='transaction-input-group'>
                <label>Status</label>
                <select name='status' value={formData.status} onChange={handleChange}>
                  <option value='Active'>Active</option>
                  <option value='Inactive'>Inactive</option>
                </select>
              </div>

              <button type='submit' className='save-transaction-btn' disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Record' : 'Save Employee'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
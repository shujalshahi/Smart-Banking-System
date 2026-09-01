const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// GET all employees (with populated Branch details)
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('branch', 'branch location manager phone email') // 👈 Fixed field names here
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
});

// POST new employee
router.post('/', async (req, res) => {
  const { name, email, role, branch, department, phone, status } = req.body;

  if (!name || !email || !role || !branch) {
    return res.status(400).json({ message: 'Name, Email, Role, and Branch are required fields.' });
  }

  try {
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'An employee with this email already exists.' });
    }

    const employee = new Employee({ name, email, role, branch, department, phone, status });
    await employee.save();
    
    // Return populated employee record
    const populatedEmployee = await Employee.findById(employee._id)
      .populate('branch', 'branch location manager phone email'); // 👈 Fixed field names here
    res.status(201).json(populatedEmployee);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create employee', error: error.message });
  }
});

// PUT update employee
router.put('/:id', async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('branch', 'branch location manager phone email'); // 👈 Fixed field names here
    res.json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update employee', error: error.message });
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete employee', error: error.message });
  }
});

module.exports = router;
# Smart Banking System

A full-stack Smart Banking System built with the MERN stack, featuring secure authentication, customer and employee management, bank account operations, transactions, branch management, and a modern responsive dashboard.

## Project Overview

Smart Banking System is a modern full-stack banking management application developed using the MERN stack (MongoDB, Express.js, React.js, and Node.js).

The application provides a modern interface for managing banking operations digitally. It demonstrates real-world full-stack development concepts including REST APIs, MongoDB integration, CRUD operations, authentication, routing, API integration, and responsive UI design.

---

# Features

## Authentication System

- Admin Login
- Customer Login
- Role-based UI
- Persistent login using localStorage
- Profile section with user information

---

## Dashboard

- Banking statistics cards
- Recent transactions
- Responsive dashboard layout
- Modern card-based UI
- Quick access to banking features

---

## Customer Management

### Features

- Add customer
- Edit customer
- Delete customer
- Search customer
- MongoDB integration
- Real-time UI updates

### Customer Fields

- Name
- Email
- Phone
- Address
- Other customer information

---

## Employee Management

### Features

- Add employee
- View employees
- Employee management interface
- Employee information handling
- MongoDB integration

---

## Branch Management

### Features

- Add branch
- View branch details
- Edit branch
- Delete branch
- Modal-based UI
- MongoDB integration

### Branch Fields

- Branch Name
- Manager Name
- Phone Number
- Location
- Email

---

## Transaction Management

### Features

- Add transaction
- Edit transaction
- Delete transaction
- Search transaction
- Transaction status badges
- Credit/Debit transaction types
- MongoDB integration

### Transaction Fields

- Sender
- Receiver
- Amount
- Type
- Status
- Date

---

## Settings

- User settings interface
- Profile-related settings
- Banking system configuration options

---

# Tech Stack

## Frontend

- React.js
- React Router DOM
- Axios
- CSS3
- React Icons
- Vite

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- CORS
- dotenv
- Nodemon

---

# Folder Structure

```text
MERN-Banking-System/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── server.js
│   └── package.json
│
└── README.md


# MongoDB Collections

## Users


Stores login and user information.

```json
{
  "name": "SystemAdmin",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "Admin"
}
```

---

## customers

Stores customer details.

```json
{
  "name": "Simon",
  "email": "simon@gmail.com"
}
```

---

## branches

Stores branch details.

```json
{
  "branch": "Main Branch",
  "manager": "Branch Manager",
  "phone": "98XXXXXXXX",
  "location": "Kathmandu",
  "email": "branch@example.com"
}
```

---

## transactions

Stores transaction details.

```json
{
  "sender": "Simon",
  "receiver": "Riya",
  "amount": "15000",
  "type": "Credit",
  "status": "Success",
  "date": "07 May 2026"
}
```

# Installation Guide

## Clone Repository

```bash
git clone https://github.com/shujalshahi/Smart-Banking-System.git
```

---

# Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# Backend Setup

```bash
cd backend
npm install
npm start
```


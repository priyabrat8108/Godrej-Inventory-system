# Godrej Inventory Management System

## 📌 Overview

Godrej Inventory Management System is a full-stack enterprise inventory solution designed to manage materials, stock movement, users, attendance, audit logs, notifications, and reporting with secure role-based access.

This project is built with a modern frontend and scalable backend architecture.

---

## 🚀 Features

### 🔐 Authentication & Security

* JWT Login / Logout
* Role-Based Access Control
* Protected Routes
* User Approval System
* Password Change / Reset Flow
* Email Verification Support

### 📦 Inventory Management

* Add / Update / Delete Inventory Items
* Stock Tracking
* Inventory Transactions
* Material Usage Logs
* Search & Filtering

### 👥 User Management

* Admin / High Authority Controls
* Manage Users
* Approve Pending Users
* Access Based Permissions

### 📊 Reports & Monitoring

* Dashboard Analytics
* Audit Logs
* Notifications
* Reporting Module

### 🧑‍💼 Extra Modules

* Attendance Management
* Work / Task Management

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Django
* Django REST Framework
* SimpleJWT

### Database

* PostgreSQL

---

## 📁 Project Structure

```text
Godrej-Inventory-system/
├── backend/
│   ├── authentication/
│   ├── inventory/
│   ├── attendance/
│   ├── audit/
│   ├── notification/
│   ├── reporting/
│   ├── work/
│   ├── core/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
```

---

## ⚙️ Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs on:

```text
http://127.0.0.1:8000/
```

---

## 💻 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173/
```

---

## 🔑 Environment Variables

Create a `.env` file inside backend folder and configure required values such as:

```env
SECRET_KEY=your_secret_key
DEBUG=True
DATABASE_URL=your_database_url
ALLOWED_HOSTS=127.0.0.1,localhost
```

---

## 📌 Main Modules

* Authentication
* Inventory
* Dashboard
* Notifications
* Audit Logs
* Reporting
* Attendance
* Work Management

---

## 📷 Demo Ready Workflow

1. Run Backend Server
2. Run Frontend Server
3. Login with valid credentials
4. Access dashboard and modules

---

## 📈 Future Enhancements

* AI-based stock prediction
* Barcode scanning
* Export reports to PDF / Excel
* Multi-branch inventory system
* Real-time notifications

---

## 👨‍💻 Author

Developed as a full-stack enterprise project for learning, deployment, and production-level practice.

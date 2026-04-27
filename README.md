# T2 Software Leave Approval System

A full-stack web application built during my internship at T2 Software. It handles the entire leave request lifecycle for company employees — from submission to manager approval.

© 2026 Kaan Kaya. All rights reserved. Proprietary and confidential.

---

## Features

- 8 leave types: annual, sick, excuse, and others
- Automatic duration calculation from date ranges or time slots (days/hours)
- Employees can track their own request status in real time (Pending, Approved, Rejected)
- Admin panel with a centralized view of all requests across all employees
- Bulk approval: select multiple requests and approve them in one click
- Filter requests by leave type or employee name
- JWT-based authentication with role-based access (Admin / Employee)
- Responsive design — works on desktop, tablet, and mobile

---

## Tech Stack

**Frontend**
- React.js with Vite
- React Router DOM for navigation
- Axios for API calls
- React Toastify for notifications
- Custom CSS

**Backend**
- Java 17+ with Spring Boot
- Spring Security with JWT authentication
- REST API

---

## Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Java JDK | 17+ |

### 1. Clone the repo

```bash
git clone https://github.com/bkaankaya/T2-Software-Leave-Approval-Application.git
cd T2-Software-Leave-Approval-Application
```

### 2. Install frontend dependencies

```bash
cd 1.giris
npm install
```

### 3. Start the development server

```bash
npm run start
```

The app runs at `http://localhost:5173` by default.

---

## Project Structure

```
T2-Software-Leave-Approval-Application/
├── 1.giris/                  React (Vite) frontend
│   ├── src/
│   │   ├── Components/
│   │   │   ├── LeaveForm/    Leave request form
│   │   │   ├── Tables/       Request listing tables
│   │   │   ├── LoginForm/    Authentication
│   │   │   └── services/     API service layer
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
└── package.json
```

---

## License

This is proprietary software. The source code is not licensed for public use, copying, or distribution. All rights reserved.
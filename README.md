# TaskFlow — Team Task Manager

<div align="center">

![TaskFlow Banner](https://img.shields.io/badge/TaskFlow-Team%20Task%20Manager-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyek0xMCAyMHYtNmg0djZoLTV6bTYtNlY5SDhsNS01djEweiIvPjwvc3ZnPg==)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.136+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**A professional team task management app with JWT auth, Kanban boards, and real-time project collaboration.**

[Features](#-features) • [Demo](#-screenshots) • [Setup](#-getting-started) • [API Docs](#-api-documentation) • [Deploy](#-deploying-to-vercel)

</div>

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure signup/login with hashed passwords and 7-day tokens
- 📁 **Project Management** — Create projects, invite team members with Admin/Member roles
- ✅ **Kanban Task Board** — Drag tasks across To Do / In Progress / Done columns
- 📊 **Dashboard Analytics** — Charts showing task status breakdown and per-user workload
- 👥 **Member Management** — Add users to projects via a searchable dropdown
- 🗑️ **Full CRUD** — Create, update, and delete tasks and projects
- 🔔 **Toast Notifications** — Real-time feedback instead of browser `alert()` dialogs
- 🎨 **Premium Dark UI** — Glassmorphism, animated backgrounds, priority badges, initials avatars

---

## 🖼️ Screenshots

| Login Page | Dashboard | Task Board |
|---|---|---|
| Animated glassmorphism auth | Stats cards + charts | Kanban with priority badges |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI (Python) |
| **Database** | MySQL (local) / PostgreSQL (production) |
| **ORM** | SQLAlchemy |
| **Auth** | JWT via `python-jose`, passwords hashed with `passlib` |
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Charts** | Chart.js |
| **Config** | `python-dotenv` |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- MySQL 8.0+ running locally

### 1. Clone the repository
```bash
git clone https://github.com/akashyadav630600/taskflow-team-manager.git
cd taskflow-team-manager
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure your environment

Copy the example env file and fill in your credentials:
```bash
copy backend\.env.example backend\.env
```

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taskmanager
SECRET_KEY=your-random-secret-key
```

### 4. Create the MySQL database
```sql
CREATE DATABASE taskmanager;
```
> Tables are created automatically on first run.

### 5. Run the app
```bash
python run.py
```

Open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## 📁 Project Structure

```
taskflow-team-manager/
├── backend/
│   ├── .env.example          # Template — copy to .env and fill in your credentials
│   ├── config.py             # Loads .env settings
│   ├── database.py           # SQLAlchemy engine setup
│   ├── models.py             # User, Project, Task, ProjectMember models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py               # JWT token creation & verification
│   ├── main.py               # FastAPI app entry point
│   └── routes/
│       ├── auth_routes.py    # /auth/signup, /auth/login, /auth/me, /auth/users
│       ├── project_routes.py # /projects/ CRUD + member management
│       ├── task_routes.py    # /tasks/ CRUD
│       └── dashboard_routes.py # /dashboard/ analytics
├── frontend/
│   ├── index.html            # Login / Signup page
│   ├── dashboard.html        # Main app dashboard
│   ├── css/styles.css        # Full dark UI design system
│   └── js/
│       ├── api.js            # Centralized API client with auth headers
│       └── dashboard.js      # Dashboard logic, Kanban, modals, toasts
├── run.py                    # One-command server startup
├── requirements.txt
└── .gitignore
```

---

## 📡 API Documentation

FastAPI auto-generates interactive API docs. After starting the server, visit:

- **Swagger UI** → [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc** → [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/signup` | ❌ | Register a new user |
| `POST` | `/auth/login` | ❌ | Login and get JWT token |
| `GET` | `/auth/me` | ✅ | Get current user info |
| `GET` | `/auth/users` | ✅ | List all users |
| `GET` | `/projects/` | ✅ | Get user's projects |
| `POST` | `/projects/` | ✅ | Create a new project |
| `DELETE` | `/projects/{id}` | ✅ Admin | Delete a project |
| `GET` | `/projects/{id}/members` | ✅ | Get project members |
| `POST` | `/projects/{id}/members` | ✅ Admin | Add a member |
| `GET` | `/tasks/project/{id}` | ✅ | Get tasks for a project |
| `POST` | `/tasks/` | ✅ Admin | Create a task |
| `PUT` | `/tasks/{id}` | ✅ | Update a task |
| `DELETE` | `/tasks/{id}` | ✅ Admin | Delete a task |
| `GET` | `/dashboard/` | ✅ | Get analytics stats |

---

## 🌐 Deploying to Vercel

Vercel is serverless and cannot host MySQL. You'll need a **free cloud PostgreSQL** database.

### Step 1 — Get a free database
Sign up at **[neon.tech](https://neon.tech)** and create a project. Copy your connection string:
```
postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 2 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import this GitHub repository
3. Add these **Environment Variables** in the Vercel dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `SECRET_KEY` | A long random secret (32+ chars) |

4. Click **Deploy** ✅

---

## 🔒 Security Notes

- Passwords are hashed using `pbkdf2_sha256` (never stored in plain text)
- JWT tokens expire after **7 days**
- The `SECRET_KEY` and database password are stored in `.env` (never committed to git)
- CORS is currently open (`*`) — restrict to your domain in production

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Made with ❤️ by [akashyadav630600](https://github.com/akashyadav630600)

⭐ Star this repo if you found it helpful!

</div>

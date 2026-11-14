<h1 align="center">Notes API</h1>

<p align="center">API REST para crear, consultar, actualizar y eliminar notas con FastAPI, SQLAlchemy y PostgreSQL.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Proyecto-FastAPI%20%C2%B7%20SQLAlchemy-31506a" alt="FastAPI · SQLAlchemy">
  <a href="LICENSE"><img src="https://img.shields.io/badge/Licencia-Ver%20archivo-31506a" alt="Ver licencia"></a>
</p>

[Contrato de la API](Notes/api_contract.md) · [Modelo de datos](Notes/ERD.md) · [Descripción del sistema](Notes/SYSTEM_OVERVIEW.md)

A **minimal, well-structured Notes API** built with **FastAPI** and **PostgreSQL**, designed as an educational MVP to practice **backend architecture**, **database design**, and **API development** with production-minded conventions.

The goal of this project is **clarity over cleverness**: clean boundaries, predictable behavior, and reproducible setup.

---

##  Features

* Create notes
* Update notes
* Delete notes
* List all notes
* Retrieve a single note by ID
* Health checks for API and database

**Out of scope (by design):**

* Authentication & authorization
* Multi-user support
* Offline support
* Native mobile applications

---

## Tech Stack

* **Python** 3.12+
* **FastAPI**
* **SQLAlchemy** 2.x
* **PostgreSQL** 16+
* **psycopg** (v3)
* **HTML / CSS / Vanilla JavaScript** (minimal frontend)

---

##  Project Structure

```text
.
├── app/
│   ├── backend/
│   │   ├── api/              # FastAPI routers (HTTP layer)
│   │   ├── core/             # Application configuration
│   │   ├── db/               # Database session and low-level setup
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── repositories/     # Data access layer
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── main.py           # FastAPI application entrypoint
│   │   └── requirements.txt
│   └── frontend/
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── db/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Seed data
├── .env.example
└── README.md
```

---

##  Architecture Overview

The backend follows a **layered architecture** with clear responsibilities:

* **API layer** – HTTP routing, validation, and request/response handling
* **Service layer** – Business logic (kept intentionally minimal for this MVP)
* **Repository layer** – Database access using SQLAlchemy
* **Model layer** – ORM models mapped to PostgreSQL tables

`main.py` is responsible **only** for wiring dependencies and routers.
It contains **no business logic** and **no direct database access**.

---

##  Requirements

* Python 3.12+
* PostgreSQL 16+
* `pip` and `venv`

---

##  Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=postgresql+psycopg://notes_user:notes_pass@localhost:5432/notes_db
```

---

##  Database Setup

### Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

### Create database and user

```bash
sudo -iu postgres psql << 'SQL'
CREATE USER notes_user WITH PASSWORD 'notes_pass';
CREATE DATABASE notes_db OWNER notes_user;
\c notes_db
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SQL
```

### Create schema and seed data

```bash
sudo -iu postgres psql -d notes_db -f db/schema.sql
sudo -iu postgres psql -d notes_db -f db/seed.sql
```

---

## 🚀 Backend Setup

```bash
cd app/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at:

* **API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

##  Frontend Setup

The frontend is intentionally minimal and framework-free.

```bash
cd app/frontend
python3 -m http.server 5173
```

Open in your browser:

```
http://127.0.0.1:5173
```

---

##  API Endpoints (Summary)

```text
GET    /notes
POST   /notes
GET    /notes/{id}
PUT    /notes/{id}
DELETE /notes/{id}
GET    /health
GET    /health/db
```

---

##  Project Status

This project represents a **completed MVP**.

Potential extensions such as authentication, migrations, automated tests, and Docker support are intentionally **out of scope** to keep the focus on core backend fundamentals.

---

**License:** Educational / Personal use

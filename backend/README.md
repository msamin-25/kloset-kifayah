# Ibtikar Backend

Muslim rental marketplace backend built with FastAPI and Supabase.

## Setup

### 1. Create virtual environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.template .env
# Edit .env with your Supabase credentials
```

### 4. Set up database

Run the SQL in `migrations/001_initial_schema.sql` in your Supabase SQL editor.

### 5. Run the server

```bash
uvicorn app.main:app --reload
```

API docs available at: http://localhost:8000/docs

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app entry
│   ├── core/             # Config, security, Supabase client
│   ├── models/           # Pydantic models & enums
│   ├── schemas/          # Request/response schemas
│   ├── api/routes/       # API endpoints
│   ├── services/         # Business logic
│   └── utils/            # Helper functions
├── migrations/           # SQL schema
└── requirements.txt
```

## API Overview

| Module | Endpoints |
|--------|-----------|
| Auth | signup, login, logout, me |
| Users | profiles, stats, listings |
| Listings | CRUD, search, availability |
| Rentals | request, accept, pickup, return, complete |
| Messages | conversations, send |
| Reviews | submit, view |
| Admin | approve listings, manage codes |

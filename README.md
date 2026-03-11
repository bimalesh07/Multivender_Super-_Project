# Multi-Vendor Platform

A backend API for a multi-vendor where multiple organizations can sell products through a single platform. Built with Django and Django REST Framework.

## Tech Stack

- **Backend:** Django 6.0, Django REST Framework
- **Database:** PostgreSQL (via Docker)
- **Auth:** JWT (PyJWT) with custom middleware
- **Frontend:** React + TypeScript (Vite)
- **Docs:** Swagger (drf-spectacular)

## Features

- **Role-Based Access** — 4 roles: Superuser, Admin, Staff, Customer
- **Multi-Vendor** — Each organization manages its own products and staff
- **Product Management** — CRUD with approval workflow, search, image gallery
- **Cart & Orders** — Stock validation, atomic transactions, order cancellation with stock restore
- **Wishlist & Address** — Default address handling, duplicate prevention
- **Pagination** — 10 items per page across all list endpoints
- **Rate Limiting** — 20 req/min (anonymous), 60 req/min (authenticated)
- **Logging** — File-based logging with rotation for debugging

## Setup

### Prerequisites
- Python 3.10+
- Docker & Docker Compose
- Node.js 18+ (for frontend)

### Backend

```bash
# Clone the repo
git clone https://github.com/bimalesh07/Multivender_Super-_Project.git
cd Multivender_Super-_Project

# Start PostgreSQL
docker-compose up -d

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Documentation

Once the server is running, visit:

```
http://localhost:8000/swagger/
```

## API Endpoints

| Module | Method | Endpoint | Access |
|--------|--------|----------|--------|
| Auth | POST | `/api/v1/accounts/register/` | Public |
| Auth | POST | `/api/v1/accounts/login/` | Public |
| Products | GET | `/api/v1/products/public/` | Public |
| Products | POST | `/api/v1/products/create/` | Admin/Staff |
| Cart | POST | `/api/v1/cart/add/` | Customer |
| Cart | GET | `/api/v1/cart/view/` | Customer |
| Orders | POST | `/api/v1/orders/place/` | Customer |
| Orders | GET | `/api/v1/orders/history/` | Customer |
| Wishlist | POST | `/api/v1/wishlist/add/` | Customer |
| Address | POST | `/api/v1/address/create/` | Customer |
| Admin | GET | `/api/v1/orders/admin/list/` | Admin/Staff |

## Project Structure

```
├── accounts/        # User auth, JWT, middleware
├── organizations/   # Vendor/org management
├── products/        # Product CRUD, approval, search
├── Cart/            # Shopping cart
├── orders/          # Order placement & management
├── wishlist/        # Customer wishlist
├── address/         # Shipping addresses
├── core/            # Settings, root URLs
└── frontend/        # React + TypeScript app
```

## Environment Variables

Create a `.env` file in the root:

```env
POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=your_secret_key
```

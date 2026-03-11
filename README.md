# Multi-Vendor

A simple, robust backend API for a multi-vendor  Built with **Django** and **Django REST Framework (DRF)**. 
This system allows multiple vendors (organizations) to list and manage their products, while customers can securely browse, add items to their cart, and place orders.

## Tech Stack
- **Backend:** Python 3, Django, Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Documentation:** Swagger UI (drf-spectacular)

## Key Features
- **Role-Based Access Control:** Differentiated roles for Superadmin, Admin, Staff, and Customer.
- **Multi-Vendor Management:** Each organization handles its own products and inventory securely.
- **Product & Order Management:** Fully functional CRUD for products. Secure cart, stock validation, and checkout flows.
- **Wishlist & Addresses:** Users can save their favorite products and manage shipping addresses.
- **API Features:** Built-in rate limiting, standard pagination, and comprehensive error logging.

## Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bimalesh07/Multivender_Super-_Project.git
   cd Multivender_Super-_Project
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the root directory:
   ```en
   POSTGRES_DB=your_db_name
   POSTGRES_USER=your_db_user
   POSTGRES_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5432
   SECRET_KEY=your_secret_key
   ```

5. **Run migrations and start the server:**
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

## Project Structure Overview
-**`accounts`**: User authentication, JWT middleware
- **`organizations`**: Vendor/organization management
- **`products`**: Product listings, categories, and inventory
- **`Cart` & `orders`**: Secure checkout and atomic order processing
- **`wishlist` & `address`**: Customer preferences
- **`core`**: Main app configurations and routing

## API Documentation
Once the local server is running, the interactive Swagger documentation is available at:
`http://localhost:8000/swagger/`

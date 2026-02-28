# MultiVendor Frontend

React + TypeScript + Tailwind CSS frontend for the MultiVendor Django API. Supports **dark and light theme** with a clean, modern UI.

## Setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the Django backend (from project root):

   ```bash
   python manage.py runserver
   ```

3. Start the frontend dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173). The app proxies `/api` and `/media` to the Django server at `http://127.0.0.1:8000`.

## Features

- **Shop**: Browse public products (no login required).
- **Auth**: Register (customer), Login (JWT). Token is stored in `localStorage`.
- **Cart**: Add/update/remove items; view cart and proceed to checkout (requires login).
- **Wishlist**: Add/remove products (requires login).
- **Orders**: Place order from cart; view order history (requires login).
- **Addresses**: CRUD shipping addresses; set default for checkout (requires login).
- **Theme**: Toggle light/dark in the header; preference is saved in `localStorage`.

## Tech

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (with `@tailwindcss/vite`)
- **React Router v7**
- **CSS variables** for theming (teal accent, warm neutrals in light; slate + teal in dark)

## Build

```bash
npm run build
```

Output is in `dist/`. For production, point your server at `dist` and configure the API base URL if not using the same origin.

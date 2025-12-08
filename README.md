# Hospital Management System

A comprehensive hospital management system built with React (Frontend) and Laravel (Backend).

## Features

### Core Functionality
- **Multi-Role Dashboard**: Admin, Doctor, Nurse, Receptionist, Pharmacist, Lab Technician, Billing, Patient
- **Patient Management**: Registration, appointments, medical records
- **Appointment System**: Booking, scheduling, and tracking
- **Pharmacy Management**: Medication inventory, dispensing, stock tracking with search
- **Laboratory**: Test ordering, results management with search
- **Billing & Payments**: Invoice generation, payment processing, insurance claims
- **Mobile Money Integration**: ZenoPay payment gateway support
- **Workflow Management**: Patient journey tracking from registration to discharge

### Recent Improvements
- ✅ **Quick Service**: Direct patient routing to pharmacy, lab, or doctor with invoice creation
- ✅ **Walk-In Patient Flow**: Proper routing based on visit type (Consultation, Lab Only, Pharmacy Only)
- ✅ **Search Functionality**: Added search in pharmacy inventory and lab tests queue
- ✅ **Low Stock Reports**: Admin can print low stock inventory with hospital logo
- ✅ **Logo Integration**: Hospital logo appears in all print reports

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Shadcn/ui components
- React Query for data fetching
- React Router for navigation

### Backend
- Laravel 11
- SQLite/MySQL database
- Sanctum for authentication
- RESTful API architecture

## Installation

### Prerequisites
- Node.js 18+ and npm
- PHP 8.2+
- Composer
- SQLite or MySQL

### Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your API URL
VITE_API_URL=http://localhost:8000/api

# Run development server
npm run dev

# Build for production
npm run build
```

### Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Create .env file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed

# Start development server
php artisan serve
```

## Development

### Running Locally

1. Start the backend server:
```bash
cd backend
php artisan serve
```

2. Start the frontend dev server:
```bash
npm run dev
```

3. Access the application at `http://localhost:5173`

### Default Test Users

After seeding, you can login with:
- **Admin**: admin@hospital.com / password
- **Doctor**: doctor@hospital.com / password
- **Nurse**: nurse@hospital.com / password
- **Receptionist**: receptionist@hospital.com / password
- **Pharmacist**: pharmacist@hospital.com / password

## Deployment

### Production Build

```bash
# Build frontend
npm run build

# The dist/ folder contains the production build
```

### Server Requirements

- Apache/Nginx web server
- PHP 8.2+
- MySQL 5.7+ or SQLite
- Composer
- Node.js (for building)

### Deployment Structure

```
public_html/
├── index.html          # Frontend (from dist/)
├── assets/             # Frontend assets
├── .htaccess          # Apache config with API routing
└── api/               # Backend (Laravel)
    ├── app/
    ├── public/
    │   └── index.php
    └── ...
```

### .htaccess Configuration

The `.htaccess` file in `public/` is configured to route API requests to the Laravel backend:

```apache
# Route API requests to Laravel
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ api/public/index.php/$1 [L,QSA]

# Route everything else to React
RewriteRule . /index.html [L]
```

## API Documentation

The API follows RESTful conventions. Base URL: `/api`

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/{id}` - Get patient
- `PUT /api/patients/{id}` - Update patient

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}` - Update appointment

### Pharmacy
- `GET /api/pharmacy/medications` - List medications
- `POST /api/pharmacy/medications` - Add medication
- `PUT /api/pharmacy/medications/{id}` - Update medication stock

See backend routes in `backend/routes/api.php` for complete API reference.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Recent Updates

See `COMPLETE_FIXES_SUMMARY.md` for detailed information about recent fixes and improvements.

## Support

For issues and questions, please open an issue on GitHub.

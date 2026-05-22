# HMS Backend - Healthcare Management System

Express.js + MongoDB backend API for the Healthcare Management System.

## Quick Start

### Prerequisites
- Node.js v16+ installed
- MongoDB (local or MongoDB Atlas cloud account)

### Installation

1. Install dependencies:
```bash
npm install
```

2. **Set up MongoDB** (read [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed instructions):
   - Option A: MongoDB Atlas Cloud (recommended)
   - Option B: Local MongoDB Installation
   - Option C: Docker

3. Create/verify `.env` file with:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hms_digital
JWT_SECRET=SUPER_SECURE_RANDOM_LONG_STRING_KEY_HMS_2026
NODE_ENV=development
```

4. Start development server:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start server with auto-reload (nodemon)
- `npm start` - Start server in production

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Patients
- `GET /api/patients` - Get all patient records
- `GET /api/patients/:id` - Get specific patient
- `POST /api/patients` - Create new patient record
- `PUT /api/patients/:id` - Update patient record
- `DELETE /api/patients/:id` - Delete patient record

## Project Structure

```
backend/
├── config/          # Database & configuration files
├── controllers/     # Route handlers & business logic
├── middleware/      # Express middleware (auth, error handling)
├── models/          # MongoDB schemas
├── routes/          # API route definitions
├── server.js        # Main app entry point
├── .env             # Environment variables
└── package.json     # Dependencies
```

## Security Features

- ✅ Helmet.js - HTTP security headers
- ✅ XSS protection - Input sanitization
- ✅ CORS - Cross-origin request handling
- ✅ Rate limiting - API request throttling
- ✅ JWT authentication - Secure token-based auth
- ✅ Password hashing - bcryptjs

## Troubleshooting

**MongoDB Connection Error?**
- Read [MONGODB_SETUP.md](./MONGODB_SETUP.md)
- Check if MongoDB is running
- Verify MONGO_URI in .env file

**Port already in use?**
- Change PORT in .env file
- Kill existing process on port 5000

## Technologies

- **Express.js** v5.2 - Web framework
- **MongoDB** - Database
- **Mongoose** v9.6 - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **nodemon** - Auto-reload during development

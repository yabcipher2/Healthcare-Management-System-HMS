# Healthcare Management System (HMS)

A comprehensive healthcare management system with integrated modules for patient care, pharmacy, laboratory, and administration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- MongoDB Atlas account
- Docker (optional, for containerized deployment)

### Installation

```bash
# Install all dependencies
npm run install:all

# Configure environment
cp .env.example backend/.env
# Edit backend/.env with your MongoDB Atlas connection string

# Test database connection
npm run test:connection

# Run in development mode
npm run dev
```

## 📁 Project Structure

```
Healthcare-Management-System-HMS/
├── backend/               # Node.js Express backend
│   ├── config/           # Database and configuration
│   ├── controllers/      # Business logic
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── scripts/          # Utility scripts
├── frontend/             # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   └── App.jsx      # Main app component
│   └── dist/            # Production build
├── .github/workflows/    # CI/CD pipelines
├── Dockerfile.backend    # Backend container image
├── Dockerfile.frontend   # Frontend container image
├── docker-compose.yml    # Multi-container orchestration
└── DEPLOYMENT.md         # Detailed deployment guide
```

## 🎯 Features

### Core Modules
- **Patient Management** - Registration, records, and tracking
- **Triage System** - Patient prioritization and queue management
- **Doctor Module** - Consultations, diagnoses, prescriptions
- **Nurse Module** - Patient care and monitoring
- **Ward Management** - Bed allocation and patient assignments
- **Pharmacy** - Medicine inventory and dispensing
- **Laboratory** - Test orders and results
- **Ultrasound/Radiology** - Imaging orders and reporting
- **Cashier Systems** - Billing for pharmacy and lab services
- **Staff Management** - User roles and permissions
- **Audit Logging** - Activity tracking and compliance

### Technical Features
- Role-based access control (RBAC)
- JWT authentication
- RESTful API architecture
- Responsive UI with Tailwind CSS
- MongoDB Atlas cloud database
- Docker containerization
- CI/CD with GitHub Actions
- Health monitoring endpoints

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Run both frontend and backend
npm run dev:backend      # Run backend only (port 5000)
npm run dev:frontend     # Run frontend only (port 5173)
```

### Production
```bash
npm run build:frontend   # Build frontend for production
npm start               # Build and start in production mode
```

### Docker
```bash
npm run docker:build    # Build Docker images
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
npm run docker:logs     # View container logs
npm run deploy          # Build and deploy with Docker
```

### Testing
```bash
npm run test:connection # Test MongoDB Atlas connection
```

## 🗄️ Database Setup

### MongoDB Atlas Configuration

1. **Create a Cluster**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free M0 cluster

2. **Create Database User**
   - Go to Database Access
   - Add a new user with Read/Write permissions

3. **Configure Network Access**
   - Go to Network Access
   - Add your IP address (or 0.0.0.0/0 for development)

4. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Add it to `backend/.env` as `MONGO_URI`

Example:
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/MesraHealthcare?retryWrites=true&w=majority
```

5. **Test Connection**
```bash
npm run test:connection
```

## 🚀 Deployment

### Docker Deployment (Recommended)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your production values

# 2. Build and deploy
docker-compose up -d --build

# 3. Check status
docker-compose ps
docker-compose logs -f
```

Access:
- Frontend: http://localhost:80
- Backend: http://localhost:5000
- Health: http://localhost:5000/api/health

### Manual Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:
- VPS/Cloud server setup
- Nginx configuration
- SSL/HTTPS setup
- Production best practices

## 🔄 CI/CD Pipeline

The project includes automated CI/CD via GitHub Actions:

### Pipeline Stages
1. **Test** - Install dependencies, build frontend, check backend syntax
2. **Build** - Create Docker images and push to Docker Hub
3. **Deploy** - Deploy to production server via SSH

### Required GitHub Secrets
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password
- `SERVER_HOST` - Production server IP/domain
- `SERVER_USER` - SSH username
- `SERVER_SSH_KEY` - SSH private key
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key

### Trigger Events
- Push to `main` or `full` branches → Full pipeline
- Pull requests → Tests only

## 🔐 Security

### Best Practices
- All passwords are hashed with bcrypt
- JWT tokens for authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- MongoDB injection prevention
- CORS configuration
- Environment variables for secrets

### Default Credentials
After initial setup, create admin user via the staff registration system.

**⚠️ Change default passwords immediately in production!**

## 📊 API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Core Modules
- `/api/patients` - Patient management
- `/api/triage` - Triage system
- `/api/doctor` - Doctor module
- `/api/nurse` - Nurse module
- `/api/ward` - Ward management
- `/api/pharmacy` - Pharmacy operations
- `/api/lab` - Laboratory services
- `/api/ultrasound` - Imaging services
- `/api/cashier` - Billing and payments
- `/api/staffs` - Staff management
- `/api/audit` - Audit logs

See individual route files in `backend/routes/` for detailed endpoints.

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT authentication
- bcrypt for password hashing
- dotenv for environment variables
- cors for cross-origin requests

### Frontend
- React 18
- Vite (build tool)
- Tailwind CSS
- Lucide React (icons)
- Fetch API for HTTP requests

### DevOps
- Docker & Docker Compose
- GitHub Actions
- Nginx (reverse proxy)
- MongoDB Atlas (cloud database)

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key
```

See `.env.example` for all available options.

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npm run test:connection

# Common fixes:
# 1. Check MONGO_URI in backend/.env
# 2. Verify IP is whitelisted in Atlas Network Access
# 3. Confirm database user credentials are correct
# 4. Check firewall/network settings
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### Docker Issues
```bash
# Reset everything
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# View logs
docker-compose logs -f backend
```

## 📚 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Comprehensive deployment guide
- [backend/MONGODB_SETUP.md](backend/MONGODB_SETUP.md) - Database setup details
- [backend/README.md](backend/README.md) - Backend API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

HMS Development Team

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the deployment guide

---

**Made with ❤️ for Healthcare**

# Axia HR Advisory - Next.js Application

A modern, full-stack HR platform built with Next.js, featuring candidate management, job search, and recruitment capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL database access
- npm or yarn

### Installation & Setup

1. **Navigate to the project directory:**
```bash
cd /Users/alvinurio/Downloads/axia-nextjs
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up the database:**
```bash
# Copy the database schema from the original project
cp /Users/alvinurio/Downloads/axioweb/database-schema.sql ./
# Run the schema in your MySQL database
```

4. **Start the development server:**
```bash
npm run dev
```

## 🌐 Access Points

- **Homepage:** http://localhost:3000
- **Candidate Login:** http://localhost:3000/candidate/login
- **Candidate Register:** http://localhost:3000/candidate/register
- **Candidate Dashboard:** http://localhost:3000/candidate/dashboard
- **API Health Check:** http://localhost:3000/api/health

## 📊 Database Configuration

The application requires a MySQL database. Configure your database connection in `.env.local`:

```env
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3306
```

**⚠️ Never commit `.env.local` or any file containing credentials to version control.**

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📋 Features Implemented

### ✅ Next.js App Router
- Modern file-based routing
- Server-side rendering (SSR)
- API routes for backend functionality
- TypeScript support

### ✅ Database Integration
- MySQL connection with connection pooling
- Secure password hashing with bcrypt
- JWT authentication system
- Database utilities with error handling

### ✅ Candidate Portal
- User registration with database storage
- Secure login with JWT authentication
- Candidate dashboard with real-time data
- Profile management system
- Responsive design with Tailwind CSS

### ✅ API Endpoints
- `POST /api/candidates/register` - Register new candidates
- `POST /api/candidates/login` - Authenticate candidates
- `GET /api/health` - Health check endpoint

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── candidates/
│   │   │   ├── register/route.ts
│   │   │   └── login/route.ts
│   │   └── health/route.ts
│   ├── candidate/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── dashboard/page.tsx
│   └── page.tsx
├── lib/
│   ├── database.ts
│   └── auth.ts
└── components/ (future components)
```

## 🔐 Authentication Flow

1. **Registration:** User fills form → API validates → Password hashed → Stored in database
2. **Login:** User credentials → API validates → JWT token generated → Stored in localStorage
3. **Protected Routes:** Token verified → Access granted to dashboard

## 🎯 Demo Credentials

The system includes demo credentials for testing:
- **Developer:** john.developer@example.com / demo123
- **Designer:** sarah.designer@example.com / demo123
- **Manager:** mike.manager@example.com / demo123

## 🚨 Troubleshooting

### Database Connection Issues
1. Verify your database credentials in `.env.local`
2. Ensure MySQL server is running
3. Check firewall settings for port 3306

### Port Conflicts
- Change port in `next.config.js` if needed

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🎉 Benefits of Next.js Migration

1. **Simplified Architecture:** No separate Express server needed
2. **Better Performance:** Server-side rendering and optimization
3. **Easier Deployment:** Single application to deploy
4. **Modern Development:** Latest React features and patterns
5. **Built-in API Routes:** No need for separate backend server
6. **TypeScript Support:** Better type safety and development experience

## 📝 Next Steps

1. **Start the application:** `npm run dev`
2. **Access the homepage:** http://localhost:3000
3. **Test candidate registration:** http://localhost:3000/candidate/register
4. **Test candidate login:** http://localhost:3000/candidate/login
5. **Explore the dashboard:** http://localhost:3000/candidate/dashboard

## 🔄 Migration Complete!

The application has been successfully migrated from React + Vite + Express to Next.js with:
- ✅ All functionality preserved
- ✅ Database integration working
- ✅ Authentication system intact
- ✅ Modern Next.js architecture
- ✅ Better performance and developer experience

**Ready to use!** 🎉
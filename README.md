# InterviewPrep AI - Complete MERN Stack Application

A production-ready MERN stack web application for interview preparation with AI-powered features.

## Features

### Authentication System
- User registration and login with JWT tokens
- Role-based access control (user/admin)
- Password hashing with bcrypt
- Protected routes on both frontend and backend
- Token expiration handling

### User Dashboard
- Profile information display
- Progress score tracking
- Completed questions overview
- Performance graph with Chart.js

### Question Bank
- Categories: Technical, Behavioral, System Design
- Difficulty levels: Easy, Medium, Hard
- Full CRUD operations
- Filter by category and difficulty
- Search functionality
- Save and mark questions as completed

### Mock Interview System
- Random question generation
- Timer per question (5 minutes)
- Answer submission with scoring
- Attempt history storage
- Score breakdown and feedback

### Performance Analytics
- Total attempts tracking
- Average score calculation
- Weak area identification
- Improvement trend visualization

### Resume Analyzer
- PDF upload and text extraction
- Skill identification via keyword matching
- Role comparison with match percentage
- Recommendations for improvement

### Admin Panel
- User management (view, delete)
- Question management
- System analytics overview

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: React (Vite), Tailwind CSS
- **Authentication**: JWT, bcrypt
- **Security**: Helmet, CORS, Rate limiting, Input validation
- **Testing**: Jest, Supertest

## Project Structure

```
InterviewPrep/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── attemptController.js
│   │   ├── questionController.js
│   │   └── resumeController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Attempt.js
│   │   ├── Question.js
│   │   ├── ResumeAnalysis.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── attempts.js
│   │   ├── questions.js
│   │   └── resumes.js
│   ├── tests/
│   │   └── api.test.js
│   ├── .env
│   ├── package.json
│   ├── seed.js
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AdminRoute.jsx
    │   │   ├── Navbar.jsx
    │   │   └── PrivateRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── AdminPanel.jsx
    │   │   ├── Analytics.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Login.jsx
    │   │   ├── MockInterview.jsx
    │   │   ├── QuestionDetail.jsx
    │   │   ├── Questions.jsx
    │   │   ├── Register.jsx
    │   │   └── ResumeAnalyzer.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

## Installation & Setup

### 1. Clone the repository

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in backend folder:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/interviewprep
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Start MongoDB

Make sure MongoDB is running locally or update the MONGODB_URI in .env to point to your MongoDB Atlas cluster.

### 5. Seed the database

```bash
cd backend
npm run seed
```

This will create:
- Admin user: admin@interviewprep.com / admin123
- Test user: user@interviewprep.com / user123
- Sample questions

### 6. Run the application

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 7. Access the application

Open http://localhost:5173 in your browser.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/logout` - Logout user

### Questions
- `GET /api/questions` - Get all questions (with filters)
- `GET /api/questions/random` - Get random questions
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create question (protected)
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/save` - Save question
- `POST /api/questions/:id/complete` - Mark complete

### Attempts
- `POST /api/attempts/submit` - Submit answer
- `GET /api/attempts` - Get user attempts
- `GET /api/attempts/analytics` - Get analytics
- `GET /api/attempts/:id` - Get attempt details

### Resume
- `POST /api/resumes/analyze` - Analyze resume
- `GET /api/resumes` - Get analysis history
- `GET /api/resumes/skills` - Get available skills

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/questions` - Get all questions (admin)
- `GET /api/admin/analytics` - Get system analytics

## Running Tests

```bash
cd backend
npm test
```

## Security Features

- Helmet middleware for HTTP headers
- Rate limiting (100 requests per 15 minutes)
- Input validation with express-validator
- Password hashing with bcrypt
- JWT token authentication
- CORS configuration
- Error handling middleware

## Demo Credentials

- **Admin**: admin@interviewprep.com / admin123
- **User**: user@interviewprep.com / user123

## License

MIT

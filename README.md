# YYC Track - Backend

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your values
4. Run development server: `npm run dev`

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### User
- GET `/api/user/profile` - Get user profile (protected)
- PUT `/api/user/profile` - Update user profile (protected)
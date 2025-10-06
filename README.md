# 💬 Real-Time Chat Application

A full-stack real-time chat application built with NestJS, Socket.IO, Prisma, PostgreSQL, and React.

## 🚀 Features

- **Real-time messaging** using Socket.IO
- **JWT-based authentication** (login/register)
- **1-to-1 chat** between users
- **Message persistence** with PostgreSQL and Prisma
- **PM2 cluster mode** support with Redis adapter
- **Modern and responsive UI** with React
- **Scalable architecture** ready for deployment

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for Render & Vercel
- **[TESTING.md](./TESTING.md)** - Testing guide and best practices
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to this project
- **[SCREENSHOTS.md](./SCREENSHOTS.md)** - Application screenshots and UI showcase
- **[LICENSE](./LICENSE)** - MIT License

## 🐳 Quick Start with Docker

If you have Docker installed, start everything with one command:

**Windows:**
```bash
docker-start.bat
```

**Mac/Linux:**
```bash
chmod +x docker-start.sh
./docker-start.sh
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API (with PM2 cluster mode)

Then start the frontend separately:
```bash
cd frontend
npm install
npm run dev
```

## 📦 Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma ORM** - Next-generation ORM for PostgreSQL
- **Socket.IO** - Real-time bidirectional communication
- **PostgreSQL** - Robust relational database
- **Redis** - For Socket.IO adapter (cluster mode)
- **PM2** - Process manager for cluster mode
- **JWT** - JSON Web Token authentication

### Frontend
- **React** - UI library
- **Vite** - Fast build tool
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client

## 📁 Project Structure

```
Realtime-chat-app/
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── chat/          # Chat module with Socket.IO Gateway
│   │   ├── prisma/        # Prisma service
│   │   ├── users/         # Users module
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── ecosystem.config.js # PM2 configuration
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

Make sure you have the following installed:
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **Redis** (optional, for PM2 cluster mode)
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Realtime-chat-app
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/chatapp?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
```

**Note:** Update the `DATABASE_URL` with your PostgreSQL credentials.

#### Database Setup

Run Prisma migrations to create the database tables:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

#### Start the Backend

**Development mode:**
```bash
npm run start:dev
```

**Production build:**
```bash
npm run build
npm run start:prod
```

**With PM2 (cluster mode):**
```bash
npm run build
npm run start:pm2
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
VITE_API_URL=http://localhost:3001
```

#### Start the Frontend

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🎮 Usage

1. **Register a new account** - Open the app and click "Register" to create a new account
2. **Login** - Use your credentials to log in
3. **Start chatting** - Select a user from the sidebar to start a conversation
4. **Real-time messaging** - Messages appear instantly without page refresh

## 🔧 PM2 Cluster Mode

To run the backend with PM2 in cluster mode:

1. **Ensure Redis is running:**
   ```bash
   redis-server
   ```

2. **Build and start with PM2:**
   ```bash
   cd backend
   npm run build
   npm run start:pm2
   ```

3. **PM2 Commands:**
   ```bash
   pm2 list           # List all processes
   pm2 logs           # View logs
   pm2 stop all       # Stop all processes
   pm2 restart all    # Restart all processes
   pm2 delete all     # Delete all processes
   ```

The `ecosystem.config.js` is configured to run 4 instances by default.

## 🚢 Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Your JWT secret
   - `REDIS_HOST` - Redis host (if using cluster mode)
   - `REDIS_PORT` - Redis port
4. Build command: `cd backend && npm install && npm run build`
5. Start command: `cd backend && npm run start:prod`

### Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Run: `vercel`
4. Set environment variable:
   - `VITE_API_URL` - Your backend URL from Render
5. Deploy: `vercel --prod`

Alternatively, connect your GitHub repository to Vercel for automatic deployments.

## 📸 Screenshots

![Screenshots Page](./docs/screenshots)

### Login Page
Beautiful gradient login/register interface with form validation.

### Chat Interface
Modern chat UI with:
- User sidebar with available contacts
- Real-time message display
- Message timestamps
- Smooth scrolling and animations

### Features in Action
- Instant message delivery
- User presence indication
- Message history persistence
- Responsive design for mobile and desktop

## 🔐 Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- CORS configured for allowed origins
- Environment variables for sensitive data
- Input validation on all endpoints

## 🐛 Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running and credentials are correct
- Check if port 3001 is available
- Verify `.env` file exists and has correct values

### Frontend can't connect to backend
- Verify backend is running on the correct port
- Check `VITE_API_URL` in frontend `.env`
- Ensure CORS is properly configured

### Socket.IO connection fails
- Check firewall settings
- Verify WebSocket support
- Check browser console for errors

### PM2 cluster mode issues
- Ensure Redis is running
- Check Redis connection in logs
- Verify PM2 ecosystem configuration

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Users
- `GET /users` - Get all users (authenticated)
- `GET /users/me` - Get current user profile

### Chat
- `GET /chat/messages?userId={id}` - Get message history between users

### Socket.IO Events
- `register` - Register user with socket
- `sendMessage` - Send a message
- `newMessage` - Receive a new message
- `messageConfirmed` - Message sent confirmation
- `getMessages` - Get message history

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Built with ❤️ using NestJS, React, and Socket.IO

---

### Quick Start Commands

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Frontend (in a new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173` and start chatting! 🎉

## ⚡ Convenience Scripts

For easier development, use these root-level commands:

```bash
# Install all dependencies (backend + frontend)
npm run install:all

# Run both backend and frontend concurrently
npm run dev

# Build both projects
npm run build

# Docker commands
npm run docker:up      # Start with Docker
npm run docker:down    # Stop Docker containers
npm run docker:logs    # View logs

# Prisma commands
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

**Note:** You need to install `concurrently` first:
```bash
npm install
```

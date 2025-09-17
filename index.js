import express from 'express';

import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

import connectDB from './Config/dbconnect.js';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chatRoutes.js';
import statusRoutes from './routes/statusRoutes.js';

import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import initializeSocket from './services/socketService.js';
import http from 'http';

// Create Server
const app = express();



const PORT = process.env.PORT;

const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));




//Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));


//Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/status', statusRoutes);


app.get('/', (req, res) => {
  res.send("Welcome to the WhatsApp API");
});

const startServer = async () => {
  // DatBase Connection 
  await connectDB();

  const server = http.createServer(app);
  const io = initializeSocket(server);

  //Apply Socket Middleware before routes
  app.use((req, res, next) => {
    req.io = io;
    req.socketUserMap = io.socketUserMap;
    next();
  });

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();

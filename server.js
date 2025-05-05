import express from "express"
import cors from 'cors'
import 'dotenv/config'
import { Server } from "socket.io"
import http from "http"
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import bookingRouter from "./routes/bookingRoute.js"  
import doctorsRouter from './routes/slotsDoctorData.js';
import departmentRouter from './routes/departmentRoute.js';

// app config
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
})

// Make io instance available to routes
app.set('io', io)

const port = process.env.PORT || 8080

// Connect to MongoDB
connectDB().catch(err => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

// Connect to Cloudinary
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/bookings", bookingRouter)
app.use("/api/doctors", doctorsRouter)
app.use("/api/departments", departmentRouter)

app.get("/", (req, res) => {
  res.send("API Working")
})


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Real-time updates
io.on('connection', socket => {
  console.log('New socket connection:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


server.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
  console.log(`Socket.IO server running on port ${port}`);
});

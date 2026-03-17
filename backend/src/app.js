const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
// const battleRoutes = require('./routes/battleRoutes')
const chatRoutes =  require("./routes/chatRoutes");
const app = express()
const passport = require("./controllers/passport");

const { startRunner } = require("./services/sandbox");

app.use(passport.initialize());
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

startRunner();

app.use('/api/auth', authRoutes)
app.use("/api/chatbot", chatRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running')
})

module.exports = app

// backend/server.js
require('dotenv').config({ path: require('path').join(__dirname,'../.env') });
const express = require('express');
const session = require('express-session');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'pmfood_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge:86400000, httpOnly:true }
}));

// Static files
app.use(express.static(path.join(__dirname,'../frontend')));

// API Routes
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/ot',     require('./routes/ot'));
app.use('/api/bus',    require('./routes/bus'));
app.use('/api/export', require('./routes/export'));

// Departments list
const { requireLogin } = require('./middleware/auth');
const db = require('./config/database');
app.get('/api/departments', requireLogin, async (req,res)=>{
  const data = await db.depts.find({}).sort({sort:1});
  res.json({success:true, data});
});

// Catch-all
app.get('*',(req,res)=>{
  if(req.path.startsWith('/api/')) return res.status(404).json({success:false,message:'Not found'});
  res.sendFile(path.join(__dirname,'../frontend/login.html'));
});

app.listen(PORT, ()=>{
  console.log(`\n✅ P.M Food OT System → http://localhost:${PORT}`);
  console.log('   กด Ctrl+C เพื่อหยุด\n');
});

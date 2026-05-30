// backend/server.js
require('dotenv').config({ path: require('path').join(__dirname,'../.env') });
const express = require('express');
const session = require('express-session');
const path    = require('path');
const bcrypt  = require('bcrypt');

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
app.get('/api/departments', requireLogin, (req,res)=>{
  const data = db.prepare('SELECT * FROM departments ORDER BY sort_order').all();
  res.json({success:true, data});
});

// ── Auto Setup: สร้าง users ถ้ายังไม่มีในฐานข้อมูล ──────────────────────────
async function autoSetup() {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
    if (userCount > 0) {
      console.log(`✅ Database พร้อมแล้ว (${userCount} users)`);
      return;
    }
    console.log('⚙️  ไม่พบ users — กำลัง setup อัตโนมัติ...');

    const departments = [
      { name_th:'ผสม1+ย่าง1',              username:'mix1',     sort_order:1  },
      { name_th:'ห้องซอย',                  username:'chop1',    sort_order:2  },
      { name_th:'ห้องแพ็ค 1',              username:'pack1',    sort_order:3  },
      { name_th:'ห้องซิล 1',               username:'seal1',    sort_order:4  },
      { name_th:'ทาโรโรล',                  username:'taroroll', sort_order:5  },
      { name_th:'ผสม 2',                    username:'mix2',     sort_order:6  },
      { name_th:'ย่าง-ซอย 2',              username:'chop2',    sort_order:7  },
      { name_th:'ห้องแพ็ค 2',              username:'pack2',    sort_order:8  },
      { name_th:'Auto Pack',                username:'autopack', sort_order:9  },
      { name_th:'อบกรอบ A ผลิต 3',         username:'bakea3',   sort_order:10 },
      { name_th:'อบกรอบ B ผลิต 3',         username:'bakeb3',   sort_order:11 },
      { name_th:'ห้องแพ็ค-ซิล น้ำจิ้ม 4', username:'pack4',    sort_order:12 },
      { name_th:'น้ำจิ้มส่วนต้น 4',        username:'sauce4',   sort_order:13 },
      { name_th:'QA',                        username:'qa',       sort_order:14 },
      { name_th:'HR/ธุรการ',                username:'hradmin',  sort_order:15 },
    ];

    const busRoutes = [
      {route_number:'1', route_name:'บุสูง',job_zone:'รวม',sort_order:1},
      {route_number:'2', route_name:'บุพราหมณ์',job_zone:'รวม',sort_order:2},
      {route_number:'3', route_name:'โนนแสนสุข',job_zone:'รวม',sort_order:3},
      {route_number:'4', route_name:'บ้านทด',job_zone:'รวม',sort_order:4},
      {route_number:'5', route_name:'แก่งดินสอ',job_zone:'รวม',sort_order:5},
      {route_number:'6', route_name:'ตรอกปลาไหล',job_zone:'รวม',sort_order:6},
      {route_number:'7', route_name:'วังมืด',job_zone:'รวม',sort_order:7},
      {route_number:'8', route_name:'วังทะลุ',job_zone:'รวม',sort_order:8},
      {route_number:'9', route_name:'ท่าล้อ',job_zone:'รวม',sort_order:9},
      {route_number:'10',route_name:'หนองเตียน 2',job_zone:'แพค/ซิลโรง 2',sort_order:10},
      {route_number:'11',route_name:'เขาดิน 1',job_zone:'แพค/ซิลโรง 1',sort_order:11},
      {route_number:'12',route_name:'โคกมัน 1',job_zone:'แพค/ซิลโรง 1',sort_order:12},
      {route_number:'13',route_name:'เขาสามสิบ 1',job_zone:'แพค/ซิลโรง 1',sort_order:13},
      {route_number:'14',route_name:'เกตุจำปา 2',job_zone:'แพค/ซิลโรง 2',sort_order:14},
      {route_number:'15',route_name:'ธารนพเก้า 2',job_zone:'แพค/ซิลโรง 2',sort_order:15},
      {route_number:'16',route_name:'สุขสำราญ 1',job_zone:'แพค/ซิลโรง 1',sort_order:16},
      {route_number:'17',route_name:'ทุ่งหินโคน 2',job_zone:'แพค/ซิลโรง 2',sort_order:17},
      {route_number:'18',route_name:'นายาว 1',job_zone:'แพค/ซิลโรง 1',sort_order:18},
      {route_number:'19',route_name:'วังกวาง 1',job_zone:'ทาโรโรล',sort_order:19},
      {route_number:'20',route_name:'ทรัพย์สมบูรณ์ 1',job_zone:'ทาโรโรล',sort_order:20},
      {route_number:'21',route_name:'น้ำทรัพย์เจริญ 2',job_zone:'แพค/ซิลโรง 2',sort_order:21},
      {route_number:'22',route_name:'เขาถ้ำ 1',job_zone:'แพค/ซิลโรง 1',sort_order:22},
      {route_number:'24',route_name:'วังมะกูด 1',job_zone:'แพค/ซิลโรง 1',sort_order:24},
      {route_number:'25',route_name:'หนองเล็ก 3',job_zone:'อบกรอบ',sort_order:25},
      {route_number:'27',route_name:'เขาฉกรรจ์ 2',job_zone:'แพค/ซิลโรง 2',sort_order:27},
      {route_number:'28',route_name:'น้ำทรัพย์ 1',job_zone:'แพค/ซิลโรง 1',sort_order:28},
      {route_number:'29',route_name:'วังใหม่ 2',job_zone:'แพค/ซิลโรง 2',sort_order:29},
      {route_number:'30',route_name:'ทับลาน 2',job_zone:'แพค/ซิลโรง 2',sort_order:30},
      {route_number:'0', route_name:'มาเอง',job_zone:'',sort_order:99},
    ];

    // Insert departments (ถ้ายังไม่มี)
    const deptCount = db.prepare('SELECT COUNT(*) as cnt FROM departments').get().cnt;
    if (deptCount === 0) {
      const ins = db.prepare('INSERT OR IGNORE INTO departments (name_th,username,sort_order) VALUES (?,?,?)');
      for (const d of departments) ins.run(d.name_th, d.username, d.sort_order);
    }

    // Insert bus routes (ถ้ายังไม่มี)
    const busCount = db.prepare('SELECT COUNT(*) as cnt FROM bus_routes').get().cnt;
    if (busCount === 0) {
      const ins = db.prepare('INSERT OR IGNORE INTO bus_routes (route_number,route_name,job_zone,sort_order) VALUES (?,?,?,?)');
      for (const r of busRoutes) ins.run(r.route_number, r.route_name, r.job_zone, r.sort_order);
    }

    // Insert users
    const deptHash = await bcrypt.hash('1234', 10);
    const hrHash   = await bcrypt.hash('hr1234', 10);
    const insUser  = db.prepare('INSERT OR IGNORE INTO users (username,password_hash,display_name,role,department_id) VALUES (?,?,?,?,?)');

    insUser.run('hr', hrHash, 'HR Admin', 'hr', null);

    const allDepts = db.prepare('SELECT * FROM departments ORDER BY sort_order').all();
    for (const d of allDepts) {
      insUser.run(d.username, deptHash, d.name_th, 'department', d.id);
    }

    console.log('✅ Auto setup สำเร็จ! สร้าง users ครบแล้ว');
  } catch(e) {
    console.error('❌ Auto setup error:', e.message);
  }
}

// Catch-all
app.get('*',(req,res)=>{
  if(req.path.startsWith('/api/')) return res.status(404).json({success:false,message:'Not found'});
  res.sendFile(path.join(__dirname,'../frontend/login.html'));
});

// Start server + auto setup
app.listen(PORT, async ()=>{
  console.log(`\n✅ P.M Food OT System → http://localhost:${PORT}`);
  await autoSetup();
  console.log('   กด Ctrl+C เพื่อหยุด\n');
});
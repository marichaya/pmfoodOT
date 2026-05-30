// backend/setup.js — รันครั้งเดียว: node backend/setup.js
require('dotenv').config({ path: require('path').join(__dirname,'../.env') });
const bcrypt = require('bcryptjs');
const db     = require('./config/database');

const DEPTS = [
  { name_th:'ผสม1+ย่าง1',              username:'mix1',     sort:1  },
  { name_th:'ห้องซอย',                  username:'chop1',    sort:2  },
  { name_th:'ห้องแพ็ค 1',              username:'pack1',    sort:3  },
  { name_th:'ห้องซิล 1',               username:'seal1',    sort:4  },
  { name_th:'ทาโรโรล',                  username:'taroroll', sort:5  },
  { name_th:'ผสม 2',                    username:'mix2',     sort:6  },
  { name_th:'ย่าง-ซอย 2',              username:'chop2',    sort:7  },
  { name_th:'ห้องแพ็ค 2',              username:'pack2',    sort:8  },
  { name_th:'Auto Pack',                username:'autopack', sort:9  },
  { name_th:'อบกรอบ A ผลิต 3',         username:'bakea3',   sort:10 },
  { name_th:'อบกรอบ B ผลิต 3',         username:'bakeb3',   sort:11 },
  { name_th:'ห้องแพ็ค-ซิล น้ำจิ้ม 4', username:'pack4',    sort:12 },
  { name_th:'น้ำจิ้มส่วนต้น 4',        username:'sauce4',   sort:13 },
  { name_th:'QA',                        username:'qa',       sort:14 },
  { name_th:'HR/ธุรการ',                username:'hradmin',  sort:15 },
];

const BUS_ROUTES = [
  { num:'1',  name:'บุสูง',             zone:'รวม',           sort:1  },
  { num:'2',  name:'บุพราหมณ์',         zone:'รวม',           sort:2  },
  { num:'3',  name:'โนนแสนสุข',         zone:'รวม',           sort:3  },
  { num:'4',  name:'บ้านทด',            zone:'รวม',           sort:4  },
  { num:'5',  name:'แก่งดินสอ',         zone:'รวม',           sort:5  },
  { num:'6',  name:'ตรอกปลาไหล',        zone:'รวม',           sort:6  },
  { num:'7',  name:'วังมืด',             zone:'รวม',           sort:7  },
  { num:'8',  name:'วังทะลุ',            zone:'รวม',           sort:8  },
  { num:'9',  name:'ท่าล้อ',             zone:'รวม',           sort:9  },
  { num:'10', name:'หนองเตียน 2',        zone:'แพค/ซิลโรง 2', sort:10 },
  { num:'11', name:'เขาดิน 1',           zone:'แพค/ซิลโรง 1', sort:11 },
  { num:'12', name:'โคกมัน 1',           zone:'แพค/ซิลโรง 1', sort:12 },
  { num:'13', name:'เขาสามสิบ 1',        zone:'แพค/ซิลโรง 1', sort:13 },
  { num:'14', name:'เกตุจำปา 2',         zone:'แพค/ซิลโรง 2', sort:14 },
  { num:'15', name:'ธารนพเก้า 2',        zone:'แพค/ซิลโรง 2', sort:15 },
  { num:'16', name:'สุขสำราญ 1',         zone:'แพค/ซิลโรง 1', sort:16 },
  { num:'17', name:'ทุ่งหินโคน 2',       zone:'แพค/ซิลโรง 2', sort:17 },
  { num:'18', name:'นายาว 1',            zone:'แพค/ซิลโรง 1', sort:18 },
  { num:'19', name:'วังกวาง 1',          zone:'ทาโรโรล',      sort:19 },
  { num:'20', name:'ทรัพย์สมบูรณ์ 1',   zone:'ทาโรโรล',      sort:20 },
  { num:'21', name:'น้ำทรัพย์เจริญ 2',  zone:'แพค/ซิลโรง 2', sort:21 },
  { num:'22', name:'เขาถ้ำ 1',           zone:'แพค/ซิลโรง 1', sort:22 },
  { num:'24', name:'วังมะกูด 1',         zone:'แพค/ซิลโรง 1', sort:24 },
  { num:'25', name:'หนองเล็ก 3',         zone:'อบกรอบ',       sort:25 },
  { num:'27', name:'เขาฉกรรจ์ 2',        zone:'แพค/ซิลโรง 2', sort:27 },
  { num:'28', name:'น้ำทรัพย์ 1',        zone:'แพค/ซิลโรง 1', sort:28 },
  { num:'29', name:'วังใหม่ 2',          zone:'แพค/ซิลโรง 2', sort:29 },
  { num:'30', name:'ทับลาน 2',           zone:'แพค/ซิลโรง 2', sort:30 },
  { num:'0',  name:'มาเอง',              zone:'',              sort:99 },
];

async function run(){
  console.log('🚀 Setup P.M Food OT System...\n');

  // Clear all
  await db.users.remove({},{multi:true});
  await db.depts.remove({},{multi:true});
  await db.busRoutes.remove({},{multi:true});

  // Insert departments
  const insertedDepts = [];
  for(const d of DEPTS){
    const doc = await db.depts.insert({ name_th:d.name_th, username:d.username, sort:d.sort });
    insertedDepts.push(doc);
  }
  console.log(`✅ สร้าง ${insertedDepts.length} แผนก`);

  // Insert bus routes
  for(const r of BUS_ROUTES){
    await db.busRoutes.insert({ route_number:r.num, route_name:r.name, job_zone:r.zone, sort:r.sort });
  }
  console.log(`✅ สร้าง ${BUS_ROUTES.length} สายรถ`);

  // Passwords
  const deptHash = await bcrypt.hash('1234','$2a$10$abcdefghijklmnopqrstuv');
  const hrHash   = await bcrypt.hash('hr1234','$2a$10$abcdefghijklmnopqrstuv');

  // HR user
  await db.users.insert({ username:'hr', password_hash:hrHash, display_name:'HR Admin', role:'hr', dept_id:null, dept_name:null });

  // Dept users
  for(const d of insertedDepts){
    await db.users.insert({ username:d.username, password_hash:deptHash, display_name:d.name_th, role:'department', dept_id:d._id, dept_name:d.name_th });
  }
  console.log(`✅ สร้าง ${insertedDepts.length+1} users\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 ข้อมูล Login:');
  console.log('   HR Admin  →  username: hr         password: hr1234');
  console.log('   หัวหน้าแผนก → username ดูด้านล่าง  password: 1234\n');
  insertedDepts.forEach(d=>console.log(`   ${d.name_th.padEnd(28)} → ${d.username}`));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Setup เสร็จ! รัน: npm run dev\n');
  process.exit(0);
}
run().catch(e=>{ console.error('❌',e.message); process.exit(1); });

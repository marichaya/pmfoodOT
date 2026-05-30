# P.M Food OT Management System

ระบบจัดการ OT และสายรถสำหรับบริษัท P.M Food

---

## 📁 โครงสร้างโปรเจค

```
pmfood-ot/
├── backend/
│   ├── config/
│   │   └── database.js       ← ตั้งค่าฐานข้อมูล NeDB
│   ├── middleware/
│   │   └── auth.js           ← ตรวจสอบสิทธิ์
│   ├── routes/
│   │   ├── auth.js           ← Login / Logout / Me
│   │   ├── ot.js             ← CRUD ข้อมูล OT
│   │   ├── bus.js            ← สายรถ + สี
│   │   └── export.js         ← Export Excel / PDF
│   ├── server.js             ← Express server หลัก
│   └── setup.js              ← Seed ข้อมูลเริ่มต้น
├── frontend/
│   ├── js/
│   │   └── app.js            ← Shared layout + utilities
│   ├── pages/
│   │   ├── dashboard.html    ← หน้า Dashboard
│   │   ├── ot-entry.html     ← หน้าลงข้อมูล OT
│   │   ├── summary-ot.html   ← รวมจำนวน OT (HR เท่านั้น)
│   │   └── bus-schedule.html ← ตารางแจ้งสายรถ + ระบบสี
│   └── login.html            ← หน้า Login
├── data/                     ← ฐานข้อมูล NeDB (สร้างอัตโนมัติ)
├── .env                      ← ตั้งค่า Environment
└── package.json
```

---

## 🚀 วิธีติดตั้งและรัน

### ขั้นที่ 1 — ติดตั้ง Node.js
ดาวน์โหลดจาก https://nodejs.org (เลือก LTS)

### ขั้นที่ 2 — เปิด Terminal ใน VSCode
```bash
# เปิดโฟลเดอร์โปรเจค
cd pmfood-ot
```

### ขั้นที่ 3 — ติดตั้ง Package
```bash
npm install
```

### ขั้นที่ 4 — Setup ฐานข้อมูล (ครั้งแรกครั้งเดียว)
```bash
node backend/setup.js
```
จะสร้าง User และข้อมูลเริ่มต้นทั้งหมด

### ขั้นที่ 5 — รันระบบ
```bash
# Development (auto-reload เมื่อแก้โค้ด)
npm run dev

# หรือ Production
npm start
```

### ขั้นที่ 6 — เปิดเว็บ
เปิด browser ไปที่: **http://localhost:3000**

---

## 🔑 ข้อมูล Login

| ผู้ใช้ | Username | Password |
|--------|----------|----------|
| HR Admin | `hr` | `hr1234` |
| ผสม1+ย่าง1 | `mix1` | `1234` |
| ห้องซอย | `chop1` | `1234` |
| ห้องแพ็ค 1 | `pack1` | `1234` |
| ห้องซิล 1 | `seal1` | `1234` |
| ทาโรโรล | `taroroll` | `1234` |
| ผสม 2 | `mix2` | `1234` |
| ย่าง-ซอย 2 | `chop2` | `1234` |
| ห้องแพ็ค 2 | `pack2` | `1234` |
| Auto Pack | `autopack` | `1234` |
| อบกรอบ A ผลิต 3 | `bakea3` | `1234` |
| อบกรอบ B ผลิต 3 | `bakeb3` | `1234` |
| ห้องแพ็ค-ซิล น้ำจิ้ม 4 | `pack4` | `1234` |
| น้ำจิ้มส่วนต้น 4 | `sauce4` | `1234` |
| QA | `qa` | `1234` |
| HR/ธุรการ | `hradmin` | `1234` |

---

## 📋 ฟีเจอร์ทั้งหมด

### สิทธิ์ HR Admin
- ✅ Dashboard รวมทุกแผนก
- ✅ ดูและกรอกข้อมูล OT ทุกแผนก
- ✅ หน้า "รวมจำนวน OT" ครบทุกแผนก
- ✅ ตารางแจ้งสายรถ + เปลี่ยนสีแถว
- ✅ Export Excel (2 ชีท: รวมOT + ตารางสายรถ)
- ✅ Export PDF

### สิทธิ์หัวหน้าแผนก
- ✅ Dashboard เฉพาะแผนกตัวเอง
- ✅ กรอกข้อมูล OT ต่อสายรถ (ทำ OT / ไม่ทำ OT)
- ✅ ตารางแจ้งสายรถ (ดูได้ทุกคน)

### ตารางสายรถ (ระบบสี)
- 🟢 สีเขียว = สายเลิก 16:00
- 🔴 สีแดง = สายเลิก 19:00 (OT)
- 🟡 สีเหลือง = รวมสาย 16:00 + 19:00
- 🔵 สีฟ้า = เข้ากะดึก
- สีจะถูกบันทึกและแสดงเมื่อ Refresh หน้า

---

## 🌐 Deploy ขึ้น Internet

### ตัวเลือก 1: Railway.app (ฟรี, ง่ายที่สุด)
1. สมัคร https://railway.app
2. กด "New Project" → "Deploy from GitHub"
3. อัพโค้ดขึ้น GitHub ก่อน แล้ว Connect
4. Set Environment Variable: `SESSION_SECRET=your_secret`
5. Railway จะ Deploy อัตโนมัติ

### ตัวเลือก 2: Render.com (ฟรี)
1. สมัคร https://render.com
2. New Web Service → Connect GitHub
3. Build Command: `npm install && node backend/setup.js`
4. Start Command: `npm start`

### ตัวเลือก 3: VPS / Server ตัวเอง
```bash
# ติดตั้ง PM2
npm install -g pm2

# รันด้วย PM2 (ทำงานค้างไว้)
pm2 start backend/server.js --name pmfood-ot
pm2 startup   # ให้รันอัตโนมัติเมื่อเครื่อง Restart
pm2 save
```

---

## ⚙️ ปรับแต่ง

### เปลี่ยน Port
แก้ไฟล์ `.env`:
```
PORT=8080
```

### เปลี่ยน Password HR
รัน `node backend/setup.js` จะ Reset ทุกอย่างใหม่
หรือแก้ในไฟล์ `backend/setup.js` บรรทัด `const HR_PASSWORD`

### ข้อมูลเก็บที่ไหน?
ข้อมูลทั้งหมดเก็บในโฟลเดอร์ `data/` เป็นไฟล์ `.db`
(NeDB — ไม่ต้องติดตั้ง MySQL หรือ Database Server แยก)

---

## 🛠️ Troubleshooting

**Port ถูกใช้งานอยู่:**
```bash
# เปลี่ยน port ใน .env
PORT=3001
```

**ข้อมูลหาย / ต้องการ Reset:**
```bash
# ลบข้อมูลเก่าแล้ว Setup ใหม่
rm -rf data/
node backend/setup.js
```

**Error: Cannot find module:**
```bash
npm install
```

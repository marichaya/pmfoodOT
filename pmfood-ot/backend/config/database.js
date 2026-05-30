// backend/config/database.js — ใช้ NeDB (pure JS, ไม่ต้องติดตั้ง MySQL)
const Datastore = require('nedb-promises');
const path = require('path');
const fs   = require('fs');

const DATA = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });

const db = {
  users:      Datastore.create({ filename: path.join(DATA,'users.db'),      autoload: true }),
  depts:      Datastore.create({ filename: path.join(DATA,'depts.db'),      autoload: true }),
  busRoutes:  Datastore.create({ filename: path.join(DATA,'busRoutes.db'),  autoload: true }),
  otEntries:  Datastore.create({ filename: path.join(DATA,'otEntries.db'),  autoload: true }),
  busSchedule:Datastore.create({ filename: path.join(DATA,'busSchedule.db'),autoload: true }),
  sessions:   Datastore.create({ filename: path.join(DATA,'sessions.db'),   autoload: true }),
};

// Indexes
db.users.ensureIndex({ fieldName: 'username', unique: true });
db.depts.ensureIndex({ fieldName: 'username', unique: true });
db.otEntries.ensureIndex({ fieldName: 'dept_date_route' });
db.busSchedule.ensureIndex({ fieldName: 'date_route' });

module.exports = db;

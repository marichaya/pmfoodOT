// backend/config/database.js
const path = require('path');
const fs   = require('fs');

const DB_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(DB_DIR, 'pmfood.db'));

// ใช้ WAL mode และ foreign keys
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_th TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    department_id INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bus_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_number TEXT NOT NULL,
    route_name TEXT NOT NULL,
    job_zone TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ot_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    work_date TEXT NOT NULL,
    bus_route_id INTEGER NOT NULL,
    ot_count INTEGER NOT NULL DEFAULT 0,
    non_ot_count INTEGER NOT NULL DEFAULT 0,
    recorder_name TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(department_id, work_date, bus_route_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bus_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_date TEXT NOT NULL,
    bus_route_id INTEGER NOT NULL,
    color_status TEXT DEFAULT 'none',
    note_1600 TEXT DEFAULT '',
    note_1900 TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(work_date, bus_route_id)
  )`);
});

// Helper: Promise-based query functions
db.qAll  = (sql, params=[]) => new Promise((res,rej) => db.all(sql, params, (e,rows) => e ? rej(e) : res(rows)));
db.qGet  = (sql, params=[]) => new Promise((res,rej) => db.get(sql, params, (e,row) => e ? rej(e) : res(row)));
db.qRun  = (sql, params=[]) => new Promise((res,rej) => db.run(sql, params, function(e) { e ? rej(e) : res(this); }));

module.exports = db; 
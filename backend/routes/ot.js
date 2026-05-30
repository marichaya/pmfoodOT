// backend/routes/ot.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { requireLogin } = require('../middleware/auth');

router.get('/dept-data', requireLogin, async (req, res) => {
  const { date, dept_id } = req.query;
  const user  = req.session.user;
  const today = date || new Date().toISOString().split('T')[0];
  const deptId = user.role === 'department' ? user.department_id : parseInt(dept_id);
  try {
    const rows = await db.qAll(
      `SELECT b.id as bus_route_id, b.route_number, b.route_name, b.job_zone, b.sort_order,
              COALESCE(e.ot_count,0) as ot_count, COALESCE(e.non_ot_count,0) as non_ot_count,
              e.recorder_name
       FROM bus_routes b
       LEFT JOIN ot_entries e ON b.id=e.bus_route_id AND e.department_id=? AND e.work_date=?
       ORDER BY b.sort_order`, [deptId, today]
    );
    const recorder = rows.find(r => r.recorder_name)?.recorder_name || '';
    res.json({ success:true, data:rows, recorder_name:recorder });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.post('/save-dept', requireLogin, async (req, res) => {
  const user = req.session.user;
  const { date, department_id, rows, recorder_name } = req.body;
  const deptId = user.role === 'department' ? user.department_id : parseInt(department_id);
  if (!deptId) return res.status(400).json({ success:false, message:'ไม่ระบุแผนก' });
  if (user.role === 'department' && user.department_id !== deptId)
    return res.status(403).json({ success:false, message:'ไม่มีสิทธิ์' });
  try {
    for (const r of rows) {
      await db.qRun(
        `INSERT INTO ot_entries (department_id,work_date,bus_route_id,ot_count,non_ot_count,recorder_name,updated_at)
         VALUES (?,?,?,?,?,?,datetime('now','localtime'))
         ON CONFLICT(department_id,work_date,bus_route_id)
         DO UPDATE SET ot_count=excluded.ot_count, non_ot_count=excluded.non_ot_count,
                       recorder_name=excluded.recorder_name, updated_at=excluded.updated_at`,
        [deptId, date, r.bus_route_id, r.ot_count||0, r.non_ot_count||0, recorder_name||'']
      );
    }
    res.json({ success:true, message:'บันทึกสำเร็จ' });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.get('/summary-ot', requireLogin, async (req, res) => {
  const today = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const rows = await db.qAll(
      `SELECT d.id, d.name_th, d.sort_order,
              COALESCE(SUM(e.ot_count),0) as ot_total,
              COALESCE(SUM(e.non_ot_count),0) as non_ot_total
       FROM departments d
       LEFT JOIN ot_entries e ON d.id=e.department_id AND e.work_date=?
       GROUP BY d.id ORDER BY d.sort_order`, [today]
    );
    const grand_ot     = rows.reduce((s,r)=>s+r.ot_total,0);
    const grand_non_ot = rows.reduce((s,r)=>s+r.non_ot_total,0);
    res.json({ success:true, data:rows, grand_ot, grand_non_ot, grand_total: grand_ot+grand_non_ot });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.get('/summary-bus', requireLogin, async (req, res) => {
  const today = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const rows = await db.qAll(
      `SELECT b.id, b.route_number, b.route_name, b.job_zone, b.sort_order,
              COALESCE(SUM(e.ot_count),0) as ot_total,
              COALESCE(SUM(e.non_ot_count),0) as non_ot_total,
              COALESCE(SUM(e.ot_count+e.non_ot_count),0) as total_count,
              COALESCE(bs.color_status,'none') as color_status,
              COALESCE(bs.note_1600,'') as note_1600,
              COALESCE(bs.note_1900,'') as note_1900
       FROM bus_routes b
       LEFT JOIN ot_entries e ON b.id=e.bus_route_id AND e.work_date=?
       LEFT JOIN bus_schedule bs ON b.id=bs.bus_route_id AND bs.work_date=?
       GROUP BY b.id ORDER BY b.sort_order`, [today, today]
    );
    res.json({ success:true, data:rows });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;

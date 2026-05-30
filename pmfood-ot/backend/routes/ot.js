// backend/routes/ot.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { requireLogin } = require('../middleware/auth');

// GET /api/ot/dept-data?date=&dept_id=   ← หน้ากรอก OT (ครบทุกสายรถ)
router.get('/dept-data', requireLogin, async (req,res)=>{
  try{
    const user  = req.session.user;
    const date  = req.query.date || today();
    const deptId= user.role==='department' ? user.dept_id : req.query.dept_id;
    const routes= await db.busRoutes.find({}).sort({sort:1});
    const entries=await db.otEntries.find({ dept_id:deptId, work_date:date });
    const map={};
    entries.forEach(e=>{ map[e.bus_route_id]={ot_count:e.ot_count, non_ot_count:e.non_ot_count, recorder_name:e.recorder_name}; });
    const recorder = entries.find(e=>e.recorder_name)?.recorder_name||'';
    const rows = routes.map(r=>({
      bus_route_id: r._id, route_number:r.route_number, route_name:r.route_name, job_zone:r.job_zone,
      ot_count:    map[r._id]?.ot_count||0,
      non_ot_count:map[r._id]?.non_ot_count||0,
    }));
    res.json({success:true, data:rows, recorder_name:recorder});
  }catch(e){ res.status(500).json({success:false,message:e.message}); }
});

// POST /api/ot/save-dept  ← บันทึกทั้งแผนก
router.post('/save-dept', requireLogin, async (req,res)=>{
  try{
    const user = req.session.user;
    const { date, department_id, rows, recorder_name } = req.body;
    const deptId = user.role==='department' ? user.dept_id : department_id;
    if(!deptId) return res.status(400).json({success:false,message:'ไม่ระบุแผนก'});
    for(const r of rows){
      await db.otEntries.update(
        { dept_id:deptId, work_date:date, bus_route_id:r.bus_route_id },
        { $set:{ ot_count:r.ot_count||0, non_ot_count:r.non_ot_count||0, recorder_name:recorder_name||'', updated_at:new Date().toISOString() }},
        { upsert:true }
      );
    }
    res.json({success:true, message:'บันทึกสำเร็จ'});
  }catch(e){ res.status(500).json({success:false,message:e.message}); }
});

// GET /api/ot/summary-ot?date=  ← ชีท "รวมจำนวน OT"
router.get('/summary-ot', requireLogin, async (req,res)=>{
  try{
    const date  = req.query.date || today();
    const depts = await db.depts.find({}).sort({sort:1});
    const data  = [];
    let gOT=0, gNon=0;
    for(const d of depts){
      const entries = await db.otEntries.find({ dept_id:d._id, work_date:date });
      const ot    = entries.reduce((s,e)=>s+e.ot_count,0);
      const non   = entries.reduce((s,e)=>s+e.non_ot_count,0);
      gOT+=ot; gNon+=non;
      data.push({ _id:d._id, name_th:d.name_th, ot_total:ot, non_ot_total:non });
    }
    res.json({success:true, data, grand_ot:gOT, grand_non_ot:gNon, grand_total:gOT+gNon});
  }catch(e){ res.status(500).json({success:false,message:e.message}); }
});

// GET /api/ot/summary-bus?date=  ← ชีท "ตารางแจ้งสายรถ"
router.get('/summary-bus', requireLogin, async (req,res)=>{
  try{
    const date   = req.query.date || today();
    const routes = await db.busRoutes.find({}).sort({sort:1});
    const data   = [];
    for(const r of routes){
      const entries = await db.otEntries.find({ bus_route_id:r._id, work_date:date });
      const sched   = await db.busSchedule.findOne({ bus_route_id:r._id, work_date:date });
      const ot    = entries.reduce((s,e)=>s+e.ot_count,0);
      const non   = entries.reduce((s,e)=>s+e.non_ot_count,0);
      data.push({
        id:r._id, route_number:r.route_number, route_name:r.route_name, job_zone:r.job_zone,
        ot_total:ot, non_ot_total:non, total_count:ot+non,
        color_status: sched?.color_status||'none',
        note_1600:    sched?.note_1600||'',
        note_1900:    sched?.note_1900||'',
      });
    }
    res.json({success:true, data});
  }catch(e){ res.status(500).json({success:false,message:e.message}); }
});

function today(){ return new Date().toISOString().split('T')[0]; }
module.exports = router;

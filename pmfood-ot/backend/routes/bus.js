// backend/routes/bus.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { requireLogin } = require('../middleware/auth');

router.get('/routes', requireLogin, async (req,res)=>{
  const routes = await db.busRoutes.find({}).sort({sort:1});
  res.json({success:true, data:routes});
});

router.post('/schedule', requireLogin, async (req,res)=>{
  try{
    const { date, bus_route_id, color_status, note_1600, note_1900 } = req.body;
    const d = date || new Date().toISOString().split('T')[0];
    await db.busSchedule.update(
      { bus_route_id, work_date:d },
      { $set:{ color_status:color_status||'none', note_1600:note_1600||'', note_1900:note_1900||'', updated_at:new Date().toISOString() }},
      { upsert:true }
    );
    res.json({success:true});
  }catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.post('/schedule/bulk', requireLogin, async (req,res)=>{
  try{
    const { date, updates } = req.body;
    const d = date || new Date().toISOString().split('T')[0];
    for(const u of updates){
      await db.busSchedule.update(
        { bus_route_id:u.bus_route_id, work_date:d },
        { $set:{ color_status:u.color_status||'none', note_1600:u.note_1600||'', note_1900:u.note_1900||'', updated_at:new Date().toISOString() }},
        { upsert:true }
      );
    }
    res.json({success:true, message:'บันทึกทั้งหมดสำเร็จ'});
  }catch(e){ res.status(500).json({success:false,message:e.message}); }
});

module.exports = router;

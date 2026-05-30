// backend/routes/export.js
const express = require('express');
const router  = express.Router();
const ExcelJS = require('exceljs');
const PDFDoc  = require('pdfkit');
const db      = require('../config/database');
const { requireLogin } = require('../middleware/auth');

function today(){ return new Date().toISOString().split('T')[0]; }

// ── Excel ─────────────────────────────────────────────────────────────────────
router.get('/excel', requireLogin, async (req,res)=>{
  const date = req.query.date||today();
  const wb   = new ExcelJS.Workbook();
  wb.creator = 'P.M Food OT System';

  const H = { font:{bold:true,color:{argb:'FFFFFFFF'},size:12},
    fill:{type:'pattern',pattern:'solid',fgColor:{argb:'FF1e3a5f'}},
    alignment:{horizontal:'center',vertical:'middle'} };

  // ── Sheet 1: รวมจำนวน OT ──
  const ws1 = wb.addWorksheet('รวมจำนวน OT');
  ws1.columns=[{width:30},{width:14},{width:14},{width:12}];
  const h1 = ws1.addRow(['หน่วยงาน (แผนก)','ทำ OT','ไม่ทำ OT','รวม']);
  h1.eachCell(c=>Object.assign(c,H)); h1.height=26;

  const depts = await db.depts.find({}).sort({sort:1});
  let gOT=0,gNon=0;
  for(const d of depts){
    const es = await db.otEntries.find({dept_id:d._id, work_date:date});
    const ot = es.reduce((s,e)=>s+e.ot_count,0);
    const non= es.reduce((s,e)=>s+e.non_ot_count,0);
    gOT+=ot; gNon+=non;
    const r=ws1.addRow([d.name_th,ot,non,ot+non]);
    r.eachCell((c,i)=>{ c.alignment={horizontal:i===1?'left':'center',vertical:'middle'}; });
  }
  const fr=ws1.addRow(['รวมทั้งหมด',gOT,gNon,gOT+gNon]);
  fr.font={bold:true};
  fr.eachCell((c,i)=>{ c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFdbeafe'}}; c.alignment={horizontal:i===1?'left':'center'}; });

  // ── Sheet 2: ตารางแจ้งสายรถ ──
  const ws2 = wb.addWorksheet('ตารางแจ้งสายรถ');
  ws2.columns=[{width:22},{width:18},{width:14},{width:14},{width:14},{width:28},{width:28}];
  const h2 = ws2.addRow(['สายรถ','จุดงาน','มาทั้งหมด','OT 19:00','เลิก 16:00','ปกติ/รวมสาย 16:00','วิ่ง OT 19:00']);
  h2.eachCell(c=>Object.assign(c,H)); h2.height=26;

  const colorMap={green:'FFdcfce7',red:'FFfee2e2',yellow:'FFfef9c3',blue:'FFdbeafe'};
  const routes = await db.busRoutes.find({}).sort({sort:1});
  for(const r of routes){
    const es = await db.otEntries.find({bus_route_id:r._id,work_date:date});
    const ot  = es.reduce((s,e)=>s+e.ot_count,0);
    const non = es.reduce((s,e)=>s+e.non_ot_count,0);
    const sch = await db.busSchedule.findOne({bus_route_id:r._id,work_date:date});
    const label = r.route_number==='0'?'มาเอง':`สาย ${r.route_number} ${r.route_name}`;
    const row = ws2.addRow([label, r.job_zone, ot+non, ot, non, sch?.note_1600||'', sch?.note_1900||'']);
    const bg  = colorMap[sch?.color_status];
    if(bg) row.eachCell(c=>{ c.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}}; });
    row.eachCell((c,i)=>{ c.alignment={horizontal:i<=2||i>=6?'left':'center',vertical:'middle'}; c.border={bottom:{style:'hair',color:{argb:'FFe2e8f0'}}}; });
  }

  const fname = `OT_PMFood_${date.replace(/-/g,'')}.xlsx`;
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="${fname}"`);
  await wb.xlsx.write(res); res.end();
});

// ── PDF ───────────────────────────────────────────────────────────────────────
router.get('/pdf', requireLogin, async (req,res)=>{
  const date = req.query.date||today();
  const doc  = new PDFDoc({size:'A4',margin:40});
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`attachment; filename="OT_PMFood_${date.replace(/-/g,'')}.pdf"`);
  doc.pipe(res);

  const depts = await db.depts.find({}).sort({sort:1});
  let gOT=0,gNon=0;
  const rows=[];
  for(const d of depts){
    const es=await db.otEntries.find({dept_id:d._id,work_date:date});
    const ot=es.reduce((s,e)=>s+e.ot_count,0);
    const non=es.reduce((s,e)=>s+e.non_ot_count,0);
    gOT+=ot; gNon+=non;
    rows.push({name:d.name_th,ot,non});
  }

  // Title
  doc.fontSize(20).fillColor('#1e3a5f').text('P.M Food — สรุป OT ประจำวัน',{align:'center'});
  doc.fontSize(11).fillColor('#64748b').text(`วันที่: ${date}`,{align:'center'}).moveDown(0.5);
  doc.fontSize(13).fillColor('#1e3a5f').text(`ทำ OT: ${gOT} คน  |  ไม่ทำ OT: ${gNon} คน  |  รวม: ${gOT+gNon} คน`,{align:'center'}).moveDown();

  // Table header
  const tableX=40, colW=[260,80,80,75];
  doc.rect(tableX,doc.y,515,24).fill('#1e3a5f');
  const hy=doc.y-20;
  doc.fillColor('#fff').fontSize(11)
    .text('หน่วยงาน (แผนก)',tableX+8,hy)
    .text('ทำ OT',tableX+colW[0]+10,hy,{width:colW[1],align:'center'})
    .text('ไม่ทำ OT',tableX+colW[0]+colW[1]+5,hy,{width:colW[2],align:'center'})
    .text('รวม',tableX+colW[0]+colW[1]+colW[2]+5,hy,{width:colW[3],align:'center'});
  doc.moveDown(0.3);

  rows.forEach((r,i)=>{
    const y=doc.y;
    if(i%2===0) doc.rect(tableX,y,515,20).fill('#f8fafc');
    doc.fillColor('#334155').fontSize(10)
      .text(r.name,tableX+8,y+4)
      .text(String(r.ot),tableX+colW[0]+10,y+4,{width:colW[1],align:'center'})
      .text(String(r.non),tableX+colW[0]+colW[1]+5,y+4,{width:colW[2],align:'center'})
      .text(String(r.ot+r.non),tableX+colW[0]+colW[1]+colW[2]+5,y+4,{width:colW[3],align:'center'});
    doc.moveDown(0.7);
  });
  // Total
  const ty=doc.y;
  doc.rect(tableX,ty,515,24).fill('#dbeafe');
  doc.fillColor('#1e3a5f').fontSize(12).font('Helvetica-Bold')
    .text('รวมทั้งหมด',tableX+8,ty+4)
    .text(String(gOT),tableX+colW[0]+10,ty+4,{width:colW[1],align:'center'})
    .text(String(gNon),tableX+colW[0]+colW[1]+5,ty+4,{width:colW[2],align:'center'})
    .text(String(gOT+gNon),tableX+colW[0]+colW[1]+colW[2]+5,ty+4,{width:colW[3],align:'center'});
  doc.end();
});

module.exports = router;

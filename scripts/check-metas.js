const ExcelJS = require('./node_modules/exceljs');
const { createClient } = require('./node_modules/@supabase/supabase-js');
const sb = createClient('https://orgziertjteuawapxvmz.supabase.co','sb_publishable_QDre9bt6fWw3BlBWfVeFfA_3B8ATV2B');

function norm(s){ return s.toLowerCase().replace(/[<>()\/.,:;°]/g,' ').replace(/\s+/g,' ').trim(); }
function sim(a,b){
  const na=norm(a), nb=norm(b);
  let i=0; while(i<na.length && i<nb.length && na[i]===nb[i]) i++;
  return i / Math.max(na.length, nb.length);
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:/Users/PC/Documents/APIZACO 2024-2027/PLANEACION 2026/SIMA/METAS MIR 2026 SIMA..xlsx');
  const ws = wb.getWorksheet(1);

  const excelRows = [];
  for(let rn=3; rn<=172; rn++){
    const row = ws.getRow(rn);
    const nom = row.getCell(2).value;
    if(!nom) continue;
    excelRows.push(nom.toString().trim());
  }

  const pages = await Promise.all([
    sb.from('indicadores').select('id,nombre').range(0,59),
    sb.from('indicadores').select('id,nombre').range(60,119),
    sb.from('indicadores').select('id,nombre').range(120,179),
    sb.from('indicadores').select('id,nombre').range(180,239),
  ]);
  const dbInds = pages.flatMap(p => p.data || []);
  const dbMap  = Object.fromEntries(dbInds.map(i => [i.nombre.trim(), i.id]));
  const dbList = dbInds.map(i => i.nombre.trim());

  let high = [], low = [], exact = 0;
  excelRows.forEach(nom => {
    if(dbMap[nom]){ exact++; return; }
    let best='', bestS=0;
    dbList.forEach(db => { const s=sim(nom,db); if(s>bestS){ bestS=s; best=db; } });
    const entry = { excel: nom, db: best, score: +(bestS*100).toFixed(1), id: dbMap[best]||null };
    if(bestS >= 0.80) high.push(entry);
    else low.push(entry);
  });

  console.log('Exactos:', exact);
  console.log('Fuzzy >=80%:', high.length);
  console.log('Fuzzy < 80% (requieren revisión manual):', low.length);

  if(low.length > 0){
    console.log('\n=== BAJA CONFIANZA — revisar antes de aplicar ===');
    low.forEach((u,i) => {
      console.log(`${i+1}. [${u.score}%] EXCEL: ${u.excel.substring(0,80)}`);
      console.log(`   DB id=${u.id}: ${(u.db||'').substring(0,80)}`);
    });
  }

  if(high.length > 0){
    console.log('\n=== ALTA CONFIANZA >=80% (primeros 10) ===');
    high.slice(0,10).forEach(u => {
      console.log(`[${u.score}%] id=${u.id}`);
      console.log(`  EXCEL: ${u.excel.substring(0,70)}`);
      console.log(`  DB:    ${u.db.substring(0,70)}`);
    });
  }
}
main().catch(e => console.error('ERROR:', e.message));

// Run 11 style-fork helper: flip Reception between
//   C (default, committed): 2-row wall face, wall-flush props one row down
//   A (untouched geometry): 1-row wall face, original prop rows
// usage: node scripts/art/reception-variant.mjs A|C
import fs from 'fs';
const want = process.argv[2];
if (want !== 'A' && want !== 'C') { console.error('usage: reception-variant.mjs A|C'); process.exit(1); }
const cat = 'client/src/phaser/systems/exploration/art/artCatalog.ts';
let s = fs.readFileSync(cat, 'utf8');
s = s.replace(/wall: \{ style: 'cream', rows: [12], trim: 'cream' \}/, `wall: { style: 'cream', rows: ${want === 'A' ? 1 : 2}, trim: 'cream' }`);
fs.writeFileSync(cat, s);
const rd = 'client/src/data/roomData.json';
const d = JSON.parse(fs.readFileSync(rd, 'utf8'));
const r = d.rooms.find(x => x.id === 'reception');
const moves = [['plant',1],['printer_station',3],['filing_cabinet',4],['filing_cabinet',15],['plant',18]];
const top = r.obstacles.find(o => o.type === 'wall' && o.x === 0 && o.y === 0 && o.width === 20);
top.height = want === 'A' ? 1 : 2;
for (const [t, x] of moves) {
  const o = r.obstacles.find(o => o.type === t && o.x === x && (o.y === 1 || o.y === 2));
  o.y = want === 'A' ? 1 : 2;
}
const board = r.obstacles.find(o => o.type === 'notice_board');
board.y = want === 'A' ? 0 : 1;
// overrides are keyed by tile — keep them pointing at the props
let txt = JSON.stringify(d, null, 2) + '\n';
const i = txt.indexOf('"id": "supply_closet"'), j = txt.indexOf('"npcs"', i);
txt = txt.slice(0, i) + txt.slice(i, j).replace(/\{\n\s+"x": (\d+),\n\s+"y": (\d+),\n\s+"width": (\d+),\n\s+"height": (\d+),\n\s+"type": "([^"]+)"\n\s+\}/g, '{ "x": $1, "y": $2, "width": $3, "height": $4, "type": "$5" }') + txt.slice(j);
fs.writeFileSync(rd, txt);
let c = fs.readFileSync(cat, 'utf8');
const row = want === 'A' ? 1 : 2, other = want === 'A' ? 2 : 1;
for (const k of ['filing_cabinet@4', 'filing_cabinet@15', 'plant@1', 'plant@18']) c = c.replace(`'${k},${other}'`, `'${k},${row}'`);
fs.writeFileSync(cat, c);
console.log(`reception -> variant ${want}`);

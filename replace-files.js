const fs = require('fs');
const path = require('path');

const baseDir = 'backend/src';
const files = [
  'produk/produk.service',
  'pesan/pesan.service',
  'mesin/mesin.service',
  'transaksi/transaksi.service',
  'pergerakan_stock/pergerakan_stock.service',
  'task/task.service',
  'user/user.service'
];

files.forEach(file => {
  const newFile = path.join(baseDir, `${file}.new.ts`);
  const originalFile = path.join(baseDir, `${file}.ts`);
  
  if (fs.existsSync(newFile)) {
    const content = fs.readFileSync(newFile, 'utf8');
    fs.writeFileSync(originalFile, content);
    fs.unlinkSync(newFile);
    console.log(`✓ Replaced ${file}.ts`);
  }
});

console.log('\n✓ Semua file telah diganti');


const http = require('http');

const data = JSON.stringify({
  schoolName: "Test School",
  isOpen: true,
  gameStartDate: "2026-04-12",
  gamePeriodsCount: 24
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/instances/1',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => console.log(d.toString()));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();

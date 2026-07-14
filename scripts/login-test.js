const http = require('http');
const data = JSON.stringify({ username: 'Nehra', password: 'Nehra@1228' });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('status', res.statusCode);
    console.log('headers', res.headers);
    console.log('body', body);
  });
});
req.on('error', (err) => console.error(err));
req.write(data);
req.end();

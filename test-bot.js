const http = require('http');

const data = JSON.stringify({
    message: 'Привет, как дела?',
    page: 'index.html'
});

console.log('Отправляю:', data);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/bot/message',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let body = '';
    console.log(`Status: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        console.log('Response:', body);
        process.exit(0);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
    process.exit(1);
});

req.write(data);
req.end();

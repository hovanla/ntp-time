const express = require('express');
const ntpClient = require('ntp-client');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

const NTP_SERVERS = [
    'time.cloudflare.com',
    'time.google.com',
    'asia.pool.ntp.org'
];

function getNTPTime(serverIndex = 0) {
    return new Promise((resolve, reject) => {
        if (serverIndex >= NTP_SERVERS.length) {
            return reject(new Error('All NTP servers failed'));
        }

        const server = NTP_SERVERS[serverIndex];
        console.log(`Trying NTP server: ${server}`);
        
        ntpClient.getNetworkTime(server, 123, (err, date) => {
            if (err) {
                console.error(`${server} failed: ${err.message}`);
                getNTPTime(serverIndex + 1).then(resolve).catch(reject);
            } else {
                console.log(`✓ Connected to ${server}`);
                resolve(date);
            }
        });
    });
}

app.get('/api/time', async (req, res) => {
    try {
        const date = await getNTPTime();
        res.json({
            datetime: date.toISOString(),
            unixtime: Math.floor(date.getTime() / 1000),
            milliseconds: date.getTime()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});

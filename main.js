const express = require('express');
const QRCode = require('qrcode');
const { Client, LocalAuth, MessageMedia   } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');


const app = express();
const port = 3000;

// Parse JSON requests
app.use(express.json());

let qrCodeString = null;
let isAuthenticated = false;

// Create a new client instance
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    authStrategy: new LocalAuth({
        dataPath: 'wasession'
    })
});

// When the client received QR-Code
client.on('qr', (qr) => {
    qrCodeString = qr;
    isAuthenticated = false;
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, {small: true});
});

// Start your client
client.initialize();

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});


// Listening to all incoming messages
client.on('message_create', message => {
	//console.log(message.body);
});

client.on('ready', async () => {
    isAuthenticated = true;
    qrCodeString = null;
    console.log('Client is ready!');

    // // Get all chats
    // const chats = await client.getChats();

    // // Filter to only group chats
    // const groups = chats.filter(chat => chat.isGroup);

    // // List group names
    // console.log('\nAvailable groups:');
    // groups.forEach((group, index) => {
    //     console.log(`${index + 1}. ${group.name}`);
    // });

    // // Example: get participants of the first group
    // const group = groups[55];

    // console.log(`\nParticipants in group "${group.name}":`);

    // const participants = group.participants;
    // participants.forEach((p,i) => {
    //     console.log(`${i++}  ${p.id.user} (${p.id._serialized})`);
    // });

    // // Simpan ke dalam file TXT
    // const txtData = participants.map(p => `${p.id.user} (${p.id._serialized})`).join('\n');
    // fs.writeFileSync('group-participants-'+group.name+'.txt', txtData, 'utf-8');
    // console.log('✅ Saved to group-participants.txt');

    // // Simpan ke dalam file JSON
    // const jsonData = participants.map(p => ({
    //     number: p.id.user,
    //     id: p.id._serialized,
    //     isAdmin: p.isAdmin,
    //     isSuperAdmin: p.isSuperAdmin
    // }));
    // fs.writeFileSync('group-participants-'+group.name+'.json', JSON.stringify(jsonData, null, 2), 'utf-8');
    // console.log('✅ Saved to group-participants.json');
});

app.get('/groups', async (req, res) => {
    try {
        const chats = await client.getChats();
        const groups = chats.filter(chat => chat.isGroup);

        const groupList = groups.map(group => ({
            id: group.id._serialized,
            name: group.name,
            participantsCount: group.participants.length
        }));

        res.json({
            status: true,
            count: groupList.length,
            groups: groupList
        });

    } catch (err) {
        console.error('Failed to fetch groups:', err);
        res.status(500).json({ status: false, error: err.message });
    }
});

app.get('/group/:id/participants', async (req, res) => {
    const groupId = req.params.id; // gunakan format ID WhatsApp grup, misalnya 1234567890-123456@g.us

    try {
        const chat = await client.getChatById(groupId);

        if (!chat.isGroup) {
            return res.status(400).json({ status: false, error: 'Chat is not a group' });
        }

        const participants = chat.participants.map(p => ({
            id: p.id._serialized,
            name: p.name || '',
            pushname: p.pushname || '',
            isAdmin: p.isAdmin,
            isSuperAdmin: p.isSuperAdmin
        }));

        res.json({
            status: true,
            groupId: chat.id._serialized,
            name: chat.name,
            participants
        });

    } catch (err) {
        console.error('Failed to get participants:', err);
        res.status(500).json({ status: false, error: err.message });
    }
});

app.post('/group/:id/send-message', async (req, res) => {
    const groupId = req.params.id; // format: 1234567890-123456@g.us
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ status: false, error: 'Message is required' });
    }

    try {
        const chat = await client.getChatById(groupId);

        if (!chat.isGroup) {
            return res.status(400).json({ status: false, error: 'Target chat is not a group' });
        }

        await client.sendMessage(groupId, message);
        res.json({ status: true, message: 'Message sent to group successfully' });
    } catch (err) {
        console.error('Failed to send group message:', err);
        res.status(500).json({ status: false, error: err.message });
    }
});

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || getExtFromMime(file.mimetype);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, filename);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // max 20MB
    fileFilter: (req, file, cb) => {
         const allowedTypes = [
            'image/jpeg', 'image/png', 'image/jpg',  'image/webp',
            'application/pdf',
            'video/mp4',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not supported'));
        }
    }
});

// Fungsi bantu untuk mendapatkan ekstensi dari MIME jika tidak tersedia
function getExtFromMime(mime) {
    const map = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'application/pdf': '.pdf',
        'video/mp4': '.mp4',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
    };
    return map[mime] || '';
}

app.post('/group/:id/send-file', upload.single('file'), async (req, res) => {
    const groupId = req.params.id;
    const message = req.body.message || '';

    if (!req.file) {
        return res.status(400).json({ status: false, error: 'File is required' });
    }

    try {
        const filePath = req.file.path;
        const mimetype = req.file.mimetype;
        const media = MessageMedia.fromFilePath(filePath);

        // Kirim sebagai sticker jika format .webp
        if (mimetype === 'image/webp') {
            await client.sendMessage(groupId, media, { sendMediaAsSticker: true });
        } else {
            await client.sendMessage(groupId, media, { caption: message });
        }

        // Hapus file setelah dikirim
        fs.unlinkSync(filePath);

        res.json({
            status: true,
            message: mimetype === 'image/webp'
                ? 'Sticker (.webp) sent to group successfully'
                : 'File sent to group successfully'
        });

    } catch (err) {
        console.error('Failed to send file:', err);
        res.status(500).json({ status: false, error: err.message });
    }
});

// REST API endpoint to send message
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ status: false, error: 'Number and message are required' });
    }

    try {
        const chatId = number.includes('@c.us') ? number : number + '@c.us';
        await client.sendMessage(chatId, message);
        res.status(200).json({ status: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ status: false, error: err.message });
    }
});


app.post('/send-broadcast', async (req, res) => {
    const { numbers, message, delayMs } = req.body;
    console.log('Broadcast request:', { numbers, message, delayMs });

    if (!numbers || !message) {
        return res.status(400).json({ status: false, error: 'numbers and message are required' });
    }

    const numberList = numbers.split(',').map(n => n.trim()).filter(n => n.length > 0);
    const delay = parseInt(delayMs) || 2000; // default delay: 2 detik

    const results = [];

    const sendSequentially = async () => {
        for (const number of numberList) {
            const chatId = number.includes('@c.us') ? number : `${number}@c.us`;

            try {
                await client.sendMessage(chatId, message);
                results.push({ number, status: 'sent' });
                console.log(`✅ Sent to ${number}`);
            } catch (err) {
                results.push({ number, status: 'failed', error: err.message });
                console.error(`❌ Failed to send to ${number}:`, err.message);
            }

            // Delay antar pesan
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    };

    sendSequentially().then(() => {
        res.json({
            status: true,
            message: 'Broadcast completed',
            total: numberList.length,
            results
        });
    });
});


app.post('/send-file', upload.single('file'), async (req, res) => {
    const { number, caption } = req.body;

    if (!number) {
        return res.status(400).json({ status: false, error: 'Number is required' });
    }

    if (!req.file) {
        return res.status(400).json({ status: false, error: 'File is required' });
    }

    try {
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        const filePath = req.file.path;
        const mimetype = req.file.mimetype;
        const media = MessageMedia.fromFilePath(filePath);

        if (mimetype === 'image/webp') {
            await client.sendMessage(chatId, media, { sendMediaAsSticker: true });
        } else {
            await client.sendMessage(chatId, media, { caption: caption || '' });
        }

        fs.unlinkSync(filePath);

        res.json({
            status: true,
            message: mimetype === 'image/webp'
                ? 'Sticker sent successfully'
                : 'File sent successfully'
        });
    } catch (err) {
        console.error('Failed to send file:', err);
        res.status(500).json({ status: false, error: err.message });
    }
});

app.get('/auth/qr', async (req, res) => {
    if (isAuthenticated) {
        return res.json({ status: 'authenticated' });
    }

    if (!qrCodeString) {
        return res.status(503).json({ status: 'pending', message: 'QR code not ready yet' });
    }

    try {
        const qrImage = await QRCode.toDataURL(qrCodeString); // base64 PNG

        res.send(`
            <html>
                <body>
                    <h2>Scan QR Code untuk Login WhatsApp</h2>
                    <img src="${qrImage}" />
                </body>
            </html>
        `);
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to generate QR image' });
    }
});

// Start Express server
app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
});
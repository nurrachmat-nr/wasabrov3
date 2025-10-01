# Wasabro V3 - WhatsApp Web API

A Node.js WhatsApp Web API built with Express.js that allows you to send messages, files, and manage groups through HTTP requests. This project uses `whatsapp-web.js` library to interact with WhatsApp Web.

## Features

- 🔐 **Authentication via QR Code** - Scan QR code to authenticate with WhatsApp
- 💬 **Send Messages** - Send text messages to individual contacts
- 📢 **Broadcast Messages** - Send messages to multiple contacts with delay
- 📁 **File Sharing** - Send images, documents, videos, and stickers
- 👥 **Group Management** - List groups, get participants, send messages to groups
- 🔄 **Session Persistence** - Maintains WhatsApp session between restarts
- 🌐 **REST API** - Easy-to-use HTTP endpoints

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Chrome/Chromium browser (installed automatically by puppeteer)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/nurrachmat-nr/wasabrov3.git
cd wasabrov3
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Authentication

1. After starting the server, visit `http://localhost:3000/auth/qr`
2. Scan the QR code with your WhatsApp mobile app
3. Once authenticated, the session will be saved for future use

## API Endpoints

### Authentication

#### Get QR Code for Authentication
```http
GET /auth/qr
```
Returns an HTML page with QR code to scan with WhatsApp.

### Individual Messages

#### Send Text Message
```http
POST /send-message
Content-Type: application/json

{
  "number": "628123456789",
  "message": "Hello from Wasabro!"
}
```

#### Send File/Media
```http
POST /send-file
Content-Type: multipart/form-data

number: 628123456789
caption: Optional caption for the file
file: [file upload]
```

Supported file types:
- Images: JPEG, PNG, WebP (WebP sent as sticker)
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Videos: MP4

### Broadcast Messages

#### Send Broadcast Message
```http
POST /send-broadcast
Content-Type: application/json

{
  "numbers": "628123456789,628987654321,628111222333",
  "message": "Broadcast message to multiple recipients",
  "delayMs": 2000
}
```

### Group Management

#### List All Groups
```http
GET /groups
```

#### Get Group Participants
```http
GET /group/{groupId}/participants
```

#### Send Message to Group
```http
POST /group/{groupId}/send-message
Content-Type: application/json

{
  "message": "Hello group!"
}
```

#### Send File to Group
```http
POST /group/{groupId}/send-file
Content-Type: multipart/form-data

message: Optional caption
file: [file upload]
```

## Response Format

### Success Response
```json
{
  "status": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "status": false,
  "error": "Error message description"
}
```

## Configuration

### File Upload Settings
- Maximum file size: 20MB
- Upload directory: `uploads/`
- Files are automatically deleted after sending

### Delay Settings
- Default broadcast delay: 2000ms (2 seconds)
- Configurable per request

## Project Structure

```
wasabrov3/
├── main.js              # Main application file
├── package.json         # Project dependencies
├── uploads/             # Temporary file storage
├── wasession/           # WhatsApp session data
├── node_modules/        # Dependencies
└── readme.md           # This file
```

## Dependencies

- **express**: Web framework for Node.js
- **whatsapp-web.js**: WhatsApp Web API client
- **qrcode**: QR code generation
- **qrcode-terminal**: Terminal QR code display
- **multer**: File upload handling

## Usage Examples

### Using cURL

Send a text message:
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{"number": "628123456789", "message": "Hello!"}'
```

Send a file:
```bash
curl -X POST http://localhost:3000/send-file \
  -F "number=628123456789" \
  -F "caption=Check this out!" \
  -F "file=@/path/to/your/file.jpg"
```

### Using JavaScript/Fetch

```javascript
// Send message
fetch('http://localhost:3000/send-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    number: '628123456789',
    message: 'Hello from JavaScript!'
  })
});

// Get groups
fetch('http://localhost:3000/groups')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Security Considerations

- This API runs without authentication - implement proper security measures for production use
- WhatsApp session data is stored locally in `wasession/` directory
- File uploads are temporarily stored and then deleted
- Consider implementing rate limiting for production deployment

## Troubleshooting

### Common Issues

1. **QR Code not appearing**: Restart the application and wait a few seconds
2. **Session expired**: Delete the `wasession/` folder and re-authenticate
3. **File upload fails**: Check file size (max 20MB) and supported formats
4. **Message not sending**: Ensure the number format includes country code without '+'

### Logs

The application logs important events to the console:
- QR code generation
- Authentication status
- Message sending results
- Error messages

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Author

**Nur Rachmat** - [nurrachmat-nr](https://github.com/nurrachmat-nr)

## Disclaimer

This project is for educational purposes. Please respect WhatsApp's Terms of Service and avoid spamming. Use responsibly and ensure compliance with local regulations regarding automated messaging.

---

**Note**: This project uses WhatsApp Web API and requires a active WhatsApp account. The session will need to be re-authenticated periodically or when WhatsApp logs out the web session.
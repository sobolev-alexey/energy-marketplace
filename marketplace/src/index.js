const express = require('express');
// const cors = require('cors');
const bodyParser = require('body-parser');
const io = require('socket.io-client');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(bodyParser.json());

async function connectWebSocket(url) {
    const options = {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 500,
        jsonp: false,
        secure: true,
        reconnectionAttempts: Infinity,
        transports: ['websocket']
    }
    const socket = io(url, options);
    return socket;
}

async function sendWebSocketMessage(socket, message) {
    await socket && socket.emit('message', message);
}

async function disconnectWebSocket(socket) {
    await socket && socket.off('message');
    await socket && socket.disconnect();
}

app.get('/activate', async (req, res) => {
    try {
        const url = 'http://localhost:8000'
        const socket = await connectWebSocket(url)
        await new Promise(resolve => setTimeout(resolve, 2000));
        await sendWebSocketMessage(socket, 'hello')
        await new Promise(resolve => setTimeout(resolve, 1000));
        await disconnectWebSocket(socket)
        res.json({
            status: 'success'
        });
    } catch (e) {
        console.error(e);
        res.json({
            status: 'failure',
            error: JSON.stringify(e)
        });
    }
});

app.post('/message', async (req, res) => {
    try {
        const message = req.body.message;
        console.log('message', message)
        res.json({
            status: 'success'
        });
    } catch (e) {
        console.error(e);
        res.json({
            status: 'failure',
            error: JSON.stringify(e)
        });
    }
});

module.exports = app;

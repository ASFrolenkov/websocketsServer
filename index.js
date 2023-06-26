const express = require('express')
const app = express()
const WSserver = require('express-ws')(app)
const aWss = WSserver.getWss()
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.ws('/', (ws, req) => {
    console.log('подключение к тесту')
    ws.on('message', (msg) => {
        const msgParsed = JSON.parse(msg)
        switch(msgParsed.method) {
            case 'connection':
                connectionHandler(ws, msgParsed)
                break;
            case 'draw':
                broadcastConnection(ws, msgParsed)
                break;
        }
    })
})

app.post('/image', (req, res) => {
    try {
        const data = req.body.img.replace('data:image/png;base64,', '')
        fs.writeFileSync(path.resolve(__dirname, 'files', `${req.query.id}.jpg`), data, 'base64')
        return res.status(200).json({message: 'Успешно'})
    } catch(e) {
        console.log(e)
        return res.status(500).json('error')
    }
})
app.get('/image', (req, res) => {
    try {
        const file = fs.readFileSync(path.resolve(__dirname, 'files', `${req.query.id}.jpg`))
        const data = 'data:image/png;base64,' + file.toString('base64')
        res.json(data)
    } catch(e) {
        console.log(e)
        return res.status(500).json('error')
    }
})

app.listen(PORT, () => {
    console.log('server started on PORT:', PORT, `localhost:${PORT}`)
})

function connectionHandler(ws, msg) {
    ws.id = msg.id
    broadcastConnection(ws, msg)
}

function broadcastConnection(ws, msg) {
    aWss.clients.forEach(client => {
        if (client.id === msg.id) {
            client.send(JSON.stringify(msg))
        }
    })
}

// import * as https from 'https';
// import * as fs from 'fs';
// import * as WebSocket from "ws";

// const options = {
//     key: fs.readFileSync('./certificates/key.pem'),
//     cert: fs.readFileSync('./certificates/cert.pem'),
//     requestCert: false,
//     rejectUnauthorized: false
// };
// const server = https.createServer(options, (req,res) => {
//     res.writeHead(200);
//     res.end("hello world\n");
// })
// server.listen(3000, () => { 
//     console.log("Server listening on port 8000");
// });
// const wss = new WebSocket.Server({ server });

import { GameServer } from './server';

new GameServer();

process.on("SIGINT", () => {
    process.exit();
});
process.on("SIGTERM", () => {
    process.exit();
});
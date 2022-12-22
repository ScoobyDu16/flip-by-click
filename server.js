import express from 'express'
import cors from 'cors'
import http from 'http'
import {Server} from 'socket.io'
import { userConnected, userDisconnected } from './sockets/user.js';

const app= express();
const PORT= process.env.PORT || 3001;

app.use(cors());

const server= http.createServer(app);

const io= new Server(server, {
    cors: {
        origin: '*'
    }
})

let heads= 0;
let tails= 0;
let roomUsers= {};
let users= [];
 
io.on('connection', (socket) =>{
    users= Array.from(io.sockets.sockets).map(socket => socket[0]);

    userConnected(socket, users);
    socket.on('disconnect', ()=> userDisconnected(socket, users));

    socket.on('request-stats', ()=>{
        socket.emit('response-stats', {heads, tails})
    })

    socket.on('join-room', ({roomId})=>{
        socket.join(roomId);
        socket.room= roomId;
        if(roomUsers[roomId]===undefined){
            roomUsers[roomId]= [];
            roomUsers[roomId].push(socket.id);
        } else{
            roomUsers[roomId].push(socket.id);
        }
        console.log(`Users ${roomId} : ${roomUsers[roomId]}`);
        socket.to(roomId).emit('user-joined', roomUsers[roomId]);
        socket.emit('user-joined', roomUsers[roomId]);
        socket.emit('response-users', users.length);
    })

    socket.on('leave-room', ({roomId})=>{
        roomUsers[roomId]= roomUsers[roomId].filter(user => user!==socket.id);
        socket.to(roomId).emit('user-left', roomUsers[roomId]);
        socket.emit('user-left', []);
        socket.leave(roomId);
        console.log(`Users ${roomId} : ${roomUsers[roomId]}`);
    })

    socket.on('toss-start', ({roomId, result})=>{
        console.log('socket room : ', socket.room);
        if(result==='Heads'){
            heads++;
        } else{
            tails++;
        }
        socket.emit('increment', {heads, tails});
        socket.broadcast.emit('increment', {heads, tails});
        socket.to(roomId).emit('toss-started', result);
    })
})

app.get('/', (req, res)=>{
    res.send(`Total : ${heads+tails} --- Heads : ${heads} --- Tails : ${tails}`);
})

server.listen(PORT, ()=>{
    console.log('Socket.io Chat Room server started on PORT : ', PORT);
})
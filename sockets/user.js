export const userConnected= (socket, users)=>{
    console.log('Connected User : ', socket.id);
    console.log(users);
    socket.broadcast.emit('response-users', users.length);
    socket.emit('response-users', users.length);
}

export const userDisconnected= (socket, users)=>{
    users= users.filter(user => user!==socket.id);
    console.log('Disconnected User : ', socket.id);
    console.log(users);
    socket.broadcast.emit('response-users', users.length);
    socket.emit('response-users', users.length);
}
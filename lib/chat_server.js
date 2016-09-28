var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var nameUsed = [];
var currentRoom = {};

exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level',1);
	io.sockets.on('connection',function(socket) {  //定义每个用户连接的处理逻辑
		guestNumber = assignGuestName(socket,guestNumber,nickNames,nameUsed); //当用户连接上来是赋予其一个访客名
		joinRoom(socket,'Lobby');
		handleMessageBroadcasting(socket,nickNames); //处理用户的消息，更名，以及聊天室的创建和变更
		handleNameChangeAttempts(socket,nickNames,nameUsed);
		handleRoomJoining(socket);
		socket.on('rooms',function() { //用户发出请求时，向其提供已经被占用的聊天室的列表
			socket.emit('rooms',io.sockets.manager.rooms);
		});
		handleClientDisconnection(socket,nickNames,nameUsed); //定义用户断开连接后的清除逻辑
	});
};

function assignGuestName(socket,guestNumber,nickNames,nameUsed) {  //分配用户昵称
	var name = 'Guest' + guestNumber;   //生成新昵称
	nickNames[socket.id] = name;  //把用户昵称跟客户端连接ID关联上
	socket.emit('nameResult',{    //让用户知道他们的昵称
		success:true,
		name:name
	});
	nameUsed.push(name);   //存放已经被占用的昵称
	return guestNumber+1;   //增加用来生成昵称的计数器
} 


function joinRoom() {  // 与进入聊天室相关的逻辑
	socket.join(room);  //让用户进入房间
	currentRoom[socket.id] = room;  //记录用户的当前房间
	socket.emit('joinResult',{room:room});  // 让用户知道他们进入了新的房间
	socket.broadcast.to(room).emit('message',{   // 让房间里的其他用户知道有新用户进入了房间
		text:nickNames[socket.id] + 'has joined' + room + '.'
	});

	var usersInRoom = io.sockets.client(room);  //确认有哪些用户在房间里
	if (usersInRoom.length>1) { //如果不止一个用户在这个房间里，汇总下都是谁
		var usersInRoomSummary = 'User currently in ' + room + ':';
		for (var index in usersInRoom) {
			var userSocketId = usersInRoom[index].id;
			if (userSocketId!=socket.id) {
				if (index > 0) {
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId]; 
			}
		}
		usersInRoomSummary += '.';
		socket.emit('message',{text:usersInRoomSummary});  //将房间里其他用户的汇总发送给这个用户
	}
}

function handleNameChangeAttempts(socket,nickNames,nameUsed) {  //更名请求的逻辑处理
	socket.on('nameAttempt',function(name) {  //添加nameAttempt事件的监听器
		if (name.indexOf('Guest') ==0 ) {   //昵称不能以Guest开头
			socket.emit('nameResult',{
				success:false,
				message:'Names cannot begin with "Guest".'
			});
		} else{
			if (nameUser.indexOf(name) == -1) {  //如果昵称还没注册就注册上
				var previousName = nickNames[socket.id];
				var previousNameIndex = nameUsed.indexOf(previousName);
				nameUsed.push(name);
				nickNames[socket.id] = name;
				delete nameUsed[previousNameIndex];  //删掉之前用的昵称,让其他用户可以使用
				socket.emit('nameResult',{
					success:true,
					name:name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message',{
					text:previousName + 'is now known as' + name + '.'
				});
			} else{
				socket.emit('nameResult',{   //如果昵称已经被占用，给客户端发送错误消息
					success:false,
					message:'That name is already i  use.'
				});
			}
		}
	});
}

function handleMessageBroadcasting(socket) { //发送聊天消息
	sockets.on('message',function(message) {
		socket.broadcast.to(message.room).emit('message',{
			text:nickNames[socket.id] + ':' + message.text
		});
	});
}

function handleRoomJoining(socket) {   // 创建房间
	socket.on('join',function(room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket,room.newRoom);
	});
}

function handleClientDisconnection(socket) { //用户断开连接
	socket.on('disconnect',function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}



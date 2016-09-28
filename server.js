//内置的http模块提供了HTTP服务器和客户端功能
var http = require('http');
//内置的fs模块提供了与文件系统相关的功能
var fs = require('fs');
// 内置的path模块提供了与文件系统路径相关的功能
var path = require('path');
// 附加的第三方模块mime有根据文件扩展名得出MIME类型的能力
var mime = require('mime');
//cache是用来缓存文件内容的对象
var cache = {};

var chatServer = require('/lib/chat_server');  //加载一个定制的Node模块,用来处理基于Socket.IO的服务端聊天功能
chatServer.listen(server);  //启动Socket.IO服务器

function send404(response) {   //在请求的文件不存在时发送404错误
	response.writeHead(404,{'Content-Type':'text/plain'});
	response.write('Error 404:resource not found');
	response.end();
}

function sendFile(response,filePath,fileContents) {   //提供文件数据服务，先写出正确的HTTP头，然后发送文件的内容
	response.writeHead(200,{'content-type':mime.lookup(path.basename(filePath))});
	response.end(fileContents);
}

// 确定文件是否缓存了，如果是，则返回它，如果文件还没有缓存，他会从硬盘读取并返回它。如果文件不存在，则返回一个HTTP 404 错误作为响应
function serverStatic(response,cache,absPath) {
	if (cache[absPath]) { //检查文件是否缓存在内存中
		sendFile(response,absPath,cache[absPath]);  //从内存中返回文件
	} else{
		fs.exists(absPath,function(exists) {        //检查文件是否存在
			if (exists) {
				fs.readFile(absPath,function(err,data) {  //从硬盘中读取文件
					if (err) {
						send404(response);
					}else{
						cache[absPath] = data;
						sendFile(response,absPath,data);  //从硬盘中读取文件并返回
					}
				});
			} else{
				send404(response);  //发送HTTP 404 响应
			}
		});
	}
}

var server = http.createServer(function(request,response) {  //创建HTTP服务器，用匿名函数定义对每个请求的处理行为
	var filePath = false;
	if (request.url == '/') {
		filePath = 'public/index.html';  //确定返回的默认HTML文件
	} else{
		filePath = 'public/'+request.url;  //将URL路径转为文件的相对路径
	}
	var absPath = './' + filePath;
	serverStatic(response,cache,absPath);  //返回静态文件
});

server.listen(3000,function() {
	console.log('Server listening on port 3000');
});
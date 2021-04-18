'use strict';

var postWebpack = function () {
	var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(wlp) {
		var resp;
		return regeneratorRuntime.wrap(function _callee$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						resp = null;
						_context2.next = 3;
						return asyncTask('cd ../' + wlp + ' && cordova prepare android');

					case 3:
						resp = _context2.sent;

						LOG(socket, resp.toString());
						_context2.next = 7;
						return asyncTask('cd ../' + wlp + ' && cordova run android --device');

					case 7:
						resp = _context2.sent;

						LOG(socket, resp.toString());

					case 9:
					case 'end':
						return _context2.stop();
				}
			}
		}, _callee, this);
	}));

	return function postWebpack(_x) {
		return _ref.apply(this, arguments);
	};
}();

// Emit welcome message on connection


function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var _marked = /*#__PURE__*/regeneratorRuntime.mark(preWebpack);

var http = require("http");
var express = require('express');
var fs = require('fs');
var copy = require('recursive-copy');
var app = express();
var bodyParser = require('body-parser');

var _require = require('child_process'),
    execSync = _require.execSync,
    exec = _require.exec;

var urlencodedParser = bodyParser.urlencoded({ extended: true });
var rimraf = require('rimraf');
var path = require("path");
var spawn = require('child_process').spawn;

var server = http.createServer(app);

var io = require('socket.io')(server);;

server.listen(8085);

var mySocket = null;

function my_exec(command, success, error) {
	console.log('start running....' + command);
	var proc = exec(command);

	var list = [];
	proc.stdout.setEncoding('utf8');

	proc.stdout.on('data', function (chunk) {
		list.push(chunk);
	});

	proc.stderr.on('data', function (chunk) {
		list.push(chunk);
	});

	proc.stdout.on('end', function () {
		console.log('stop running....' + command);
		success(list.join());
	});

	proc.stdout.on('error', function () {
		error();
	});
}

function asyncTask(task) {

	return new Promise(function (resolve, reject) {
		my_exec(task, resolve, reject);
	});
}

function preWebpack(branch, wlp) {
	var cmd, buildType, server, webpack;
	return regeneratorRuntime.wrap(function preWebpack$(_context) {
		while (1) {
			switch (_context.prev = _context.next) {
				case 0:
					_context.next = 2;
					return removeAllFiles(branch, wlp);

				case 2:
					cmd = _context.sent;
					_context.next = 5;
					return asyncTask(cmd);

				case 5:
					buildType = _context.sent;
					_context.next = 8;
					return createWebpackconfigFile(wlp, buildType);

				case 8:
					server = _context.sent;
					_context.next = 11;
					return updateJs(wlp, server, buildType);

				case 11:
					webpack = _context.sent;
					_context.next = 14;
					return asyncTask(webpack);

				case 14:
				case 'end':
					return _context.stop();
			}
		}
	}, _marked, this);
}

io.on('connection', function (socket) {
	console.log('Client connected...');

	socket.on('delete', function (data) {
		var wlp = data.wlp;

		removeExtraFiles(wlp);
	});

	socket.on('release', function (data) {
		var branch = data.branch,
		    wlp = data.wlp,
		    buildType = data.buildType,
		    build = data.build,
		    isUpload = data.isUpload,
		    server = data.server;
	});

	socket.on('submit', function (data) {
		var branch = data.branch,
		    wlp = data.wlp,
		    buildType = data.buildType,
		    build = data.build,
		    isUpload = data.isUpload,
		    server = data.server;

		var source = '../' + wlp + '/www';
		var svn = 'cd ' + source + ' && svn ' + (branch ? 'co ' + branch + ' .' : 'up');

		// function generator
		var it = preWebpack(branch, wlp);

		// Remove file if required
		it.next();

		//Run svn
		it.next(svn).value.then(function () {
			// create and copy webpack config file
			it.next(buildType);

			// Updating index, config and phonegapApi file.
			it.next(server);

			// Running webpack
			var cmdWebpack = buildType === 'release' ? 'webpack --config=webpack.config.release.js' : 'webpack';
			it.next('cd ../' + wlp + ' && ' + cmdWebpack).value.then(function (data) {
				LOG(socket, data.toString());
			});
		});

		/*
  if(buildType === 'release'){
  removeExtraFiles(wlp);
  }
  console.log('Build: '+(build));		
  if(buildType == 'release' || build){
  // prepare android platform
  my_exec('cd ../'+ wlp+' && cordova prepare android', function(data){
  LOG(socket, data.toString());
  // 
  var cmdBuild = 'cordova run android --device';
  if(buildType === 'release'){
  cmdBuild = cmdBuild + ' --release';
  // Create release-signing.properties file if not exist
  createReleaseSignFile(wlp);
  LOG(socket, 'Create release-signing.properties file if not exist');
  }
  LOG(socket, 'build process start...'+ cmdBuild);
  my_exec('cd ../'+ wlp +' && '+cmdBuild, function(data){
  LOG(socket, data.toString());
  LOG(socket, 'build process end...');
  				//upload build to dropbox
  if(buildType === 'release' || isUpload === 'true'){
  LOG(socket, 'uploading apk file to dropbox...');
  var fileupload =   `curl -X POST https://content.dropboxapi.com/2/files/upload --header "Authorization: Bearer XawczATPkRAAAAAAAAAAq7WHRFkh3dld-r3AKsLQG2R7GnTUwHC3T5Mk000JMPvK" --header "Dropbox-API-Arg: {\\"path\\": \\"/FILE_NAME\\",\\"mode\\": \\"add\\",\\"autorename\\": true,\\"mute\\": false}" --header "Content-Type: application/octet-stream" --data-binary @app-debug.apk`;
  var apkName =  wlp+ '_'+ buildType +'.apk'; 
  fileupload =  fileupload.replace(/FILE_NAME/g, apkName);
  my_exec('cd ../'+ wlp +'/platforms/android/app/build/outputs/apk/'+ buildType +' && '+fileupload, function(data){
  LOG(socket, data.toString());
  // get shared link
  var sharedLink = 'curl -X POST https://api.dropboxapi.com/2/files/get_temporary_link --header "Authorization: Bearer XawczATPkRAAAAAAAAAApjalAtOtrpoDDC9PF0du8aYhT8-Gg_FAvFZ-YUPooA31" --header "Content-Type: application/json" --data "{\\"path\\": \\"/FILE_NAME\\"}"';
  sharedLink =  sharedLink.replace(/FILE_NAME/g, apkName);
  var link = my_exec('cd ../'+ wlp +'/platforms/android/app/build/outputs/apk/debug && '+sharedLink, function(data){
  LOG(socket, 'Shared Link: '+JSON.parse(data).link);
  });
  				});
  }
  });
  });
  }
  });
  }); */
	});
});

function createWebpackconfigFile(wlp, buildType) {
	var webpackConfigFile = '../' + wlp + (buildType === 'release' ? '/webpack.config.release.js' : '/webpack.config.js');
	var commonWebpackFile = buildType === 'release' ? 'webpack.config.common.release.js' : 'webpack.config.common.js';
	var data = readFileSync(commonWebpackFile);
	var APP_NAME = wlp === 'uLink' ? 'Uniteller' : wlp;
	data = data.toString().replace(/APP_NAME/, APP_NAME).replace(/SERVER/, server);
	writeFileSync(webpackConfigFile, data);
}

function LOG(sc, message) {
	sc.emit('message', { message: message, id: sc.id });
}

app.get('/form1', function (req, res) {

	res.sendFile(path.join(__dirname + '/index.htm'));
});

function createReleaseSignFile(wlp) {
	var dir = '../' + wlp + '/platforms/android/',
	    store = require('./store.json')[wlp],
	    file = 'release-signing.properties';

	if (!fs.existsSync(path)) {
		// Do something
		console.log('creating release signed file.');
		var data = readFileSync(file);
		data = data.toString().replace(/KEYSTORE_FILE_PATH/, store.KEYSTORE_FILE_PATH).replace(/KEYSTORE_PASSWORD/, store.KEYSTORE_PASSWORD).replace(/KEY_ALIAS/, store.KEY_ALIAS).replace(/KEY_PASSWORD/, store.KEY_PASSWORD);
		writeFileSync(dir + file, data);
	}
}

function removeAllFiles(branch, dir) {
	console.log('removeFiles' + dir);
	if (branch) {
		rimraf.sync('../' + dir + '/www/*');
		rimraf.sync('../' + dir + '/www/.svn');
		rimraf.sync('../' + dir + '/platforms/android/app/src/main/assets/www/.svn');
		rimraf.sync('../' + dir + '/platforms/android/assets/www/.svn');
		return 'files deleted!!!';
	} else {
		return 'No files deleted!!!';
	}
}

function readFileSync(filename) {
	return fs.readFileSync(filename, 'utf8');
}

function writeFileSync(filename, data) {
	return fs.writeFileSync(filename, data, 'utf8');
}

function svnUporCo(cmd, sc) {
	console.log('SVN: ' + cmd);
	return execSync(cmd).toString();
}

function updateBuildFile(file, req) {
	console.log('Create build file: ' + file);
	var data = readFileSync(file);
	data = data.toString().replace(/APP_NAME/, req.body.WLP);
	writeFileSync('../' + req.body.WLP + '/' + file, data);
}

function updateJs(wlp, server, buildType) {
	var file = '../' + wlp + '/www/js/phonegapApi.js',
	    index = '../' + wlp + '/www/index.html',
	    server = server,
	    config = require('./tokens.json'),
	    configFile = '../' + wlp + '/www/' + (wlp == 'uLink' ? 'js/config.json' : wlp + '/js/config.json'),
	    wlp = wlp == 'uLink' ? 'Uniteller' : wlp,
	    data = config[server],
	    SERVER_NAME = data.SERVER_NAME,
	    AUTHENTICATION_CODE = data[wlp].AUTHENTICATION_CODE,
	    AUTHENTICATION_TOKEN = data[wlp].AUTHENTICATION_TOKEN,
	    PARTNER_CODE = data[wlp].PARTNER_CODE;

	var data = readFileSync(file);
	var result;
	if (buildType == 'release') {
		result = data.replace(/\"WLP_NAME\": \"[A-Za-z]+/, '"WLP_NAME": "' + wlp).replace(/\/\/console.log =/, 'console.log =').replace(/sandbox/g, 'production');
	} else {
		result = data.replace(/\"WLP_NAME\": \"[A-Za-z]+/, '"WLP_NAME": "' + wlp)
		// .replace(/console.log =/, '\/\/console.log =')
		.replace(/production/g, 'sandbox');
	}

	writeFileSync(file, result);

	data = readFileSync(index);
	result = data.replace(/https:\/\/[A-Za-z\.:0-9]+\//, SERVER_NAME);
	writeFileSync(index, result);

	//console.log(configFile);
	data = readFileSync(configFile);
	result = data.replace(/\"AUTHENTICATION_CODE\": \"[A-Za-z0-9]+/, '"AUTHENTICATION_CODE": "' + AUTHENTICATION_CODE).replace(/\"AUTHENTICATION_TOKEN\": \".+/, '"AUTHENTICATION_TOKEN": "' + AUTHENTICATION_TOKEN + '",').replace(/\"SERVER_NAME\": \".+/, '"SERVER_NAME": "' + SERVER_NAME + '",').replace(/\"PARTNER_CODE\": \"[A-Za-z]+/, '"PARTNER_CODE": "' + PARTNER_CODE);

	//  console.log(result);
	writeFileSync(configFile, result);
}

function removeExtraFiles(app_name) {
	var path = require("path"),
	    p = "../" + app_name + "/www",
	    p1 = "../" + app_name + "/www/js",
	    exclude = ['build', 'css', 'fonts', 'js', 'cordova', 'index.html', '.svn'],
	    excludeJs = ['bootstrap.min.js', 'hammer.js', 'jquery.maskedinput.min.js', 'jquery.min.js', 'lodash.js', 'sweetalert.min.js', 'link-initialize.js'],
	    folder = app_name,
	    wlpFolder = '';

	if (folder == 'uLink') {
		folder = 'images';
	} else {
		wlpFolder = p + '/' + folder + '/js';
	}
	console.log('==============>' + folder);
	exclude.push(folder);

	removeFiles(p, exclude);
	removeFiles(p1, excludeJs);

	if (wlpFolder) {
		removeFiles(wlpFolder, []);
	}

	function removeFiles(p, ex) {
		fs.readdir(p, function (err, files) {
			if (err) {
				throw err;
			}
			files.forEach(function (file) {
				if (ex.indexOf(file) == -1) {
					console.log('Files deleted: ' + file.replace(p, ""));
					file = path.join(p, file);
					fs.statSync(file).isFile() ? fs.unlinkSync(file) : rimraf.sync(file);
				}
			});
		});
	}
}

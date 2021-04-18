var http = require("http");
var express = require('express');
var fs = require('fs');
var copy = require('recursive-copy');
var app = express();
var bodyParser = require('body-parser');
const { execSync, exec } = require('child_process');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
const rimraf = require('rimraf');
var path    = require("path");
var spawn = require('child_process').spawn;
 

var server = http.createServer(app);

var io = require('socket.io')(server);;

server.listen(8083);

var mySocket = null;

function my_exec(command, callback) {
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
        callback(list.join());
    });
}

function asyncTask(task){

	return new Promise(function(resolve, reject){
		myexec(task, function(data){
			resolve(data);
		});
	});
}

// Emit welcome message on connection
io.on('connection', function (socket) {
	console.log('Client connected...');
	
	socket.on('submit', function(data){
		var branch = data.branch,
			server = data.server,
			wlp = data.WLP,
			buildType = data.buildType,
			build = data.build,
			isUpload = data.isUpload;

			console.log(build+', '+isUpload);

			var source = '../'+ wlp + '/www';
			var svn  = 'cd '+source+ ' && svn up'
			 if(branch){
				removeAllFiles(wlp);
				LOG(socket,execSync('cd '+source+ ' && svn co '+branch+ ' .').toString());
			}

		// SVN UPDATE
		// var tasks = asyncTask(svn);
		// 	tasks.then(function(result){
		// 		LOG(socket, result);
		// 	});
		my_exec(svn, function(data){
			LOG(socket, data.toString());
			
			// create and copy webpack config file
			LOG(socket, "Created and copy webpack config file");
			createWebpackconfigFile(wlp, buildType);

			// 
			LOG(socket, "Updating index, config and phonegapApi file.");
			updateJs(wlp, server);
			
			// Running webpack
			var cmdWebpack = buildType === 'release' ? 'webpack --config=webpack.config.release.js' : 'webpack';
			console.log('running '+cmdWebpack);
			LOG(socket, 'running '+cmdWebpack);
			my_exec('cd ../'+wlp+' && '+cmdWebpack, function(data){
				LOG(socket, data.toString());
				LOG(socket, 'Open in new tab: '+ 'http://10.72.15.94/Fluxxor/'+ wlp +'/www');
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
		
		});
	  

	})

});

function createWebpackconfigFile(wlp, buildType){
	var webpackConfigFile = '../'+ wlp + (buildType === 'release' ? '/webpack.config.release.js' : '/webpack.config.js');
		var commonWebpackFile = buildType === 'release' ? 'webpack.config.common.release.js' : 'webpack.config.common.js';
		var data = readFileSync(commonWebpackFile);	 
		var APP_NAME = wlp === 'uLink' ? 'Uniteller' : wlp;
		data = data.toString()
					.replace(/APP_NAME/, APP_NAME)
					.replace(/SERVER/, server);
		writeFileSync(webpackConfigFile, data);
}

function LOG(sc, message){
	sc.emit('message', {message: message, id: sc.id});
}

app.get('/form', function (req, res) {
	
	res.sendFile(path.join(__dirname+'/index.htm'));
  
});
 
function createReleaseSignFile(wlp){
		var dir = '../'+ wlp + '/platforms/android/',
			store = require('./store.json')[wlp],
			file = 'release-signing.properties';
			
			if (!fs.existsSync(path)) {
				// Do something
				console.log('creating release signed file.');
				var data = readFileSync(file);
				data = data.toString()
						.replace(/KEYSTORE_FILE_PATH/, store.KEYSTORE_FILE_PATH)
						.replace(/KEYSTORE_PASSWORD/, store.KEYSTORE_PASSWORD)
						.replace(/KEY_ALIAS/, store.KEY_ALIAS)
						.replace(/KEY_PASSWORD/, store.KEY_PASSWORD);
				writeFileSync(dir+file, data);
			}
	}

	function removeAllFiles(dir){
		rimraf.sync('../'+ dir + '/www/*');
		rimraf.sync('../'+ dir + '/www/.svn');
		rimraf.sync('../'+ dir + '/platforms/android/app/src/main/assets/www/.svn');
		rimraf.sync('../'+ dir + '/platforms/android/assets/www/.svn');
	}
	
	function readFileSync(filename) {
		return fs.readFileSync(filename, 'utf8');
	}
	
	function writeFileSync(filename, data) {
		return fs.writeFileSync(filename, data, 'utf8');
	}
	
	function svnUporCo(cmd, sc){
		console.log('SVN: '+cmd);
		return execSync(cmd).toString();
	}

	function updateBuildFile(file, req){
		console.log('Create build file: '+file);
		var data = readFileSync(file);
		data = data.toString().replace(/APP_NAME/, req.body.WLP);
		writeFileSync('../'+ req.body.WLP+'/'+file, data);
		
	}
	
	function updateJs(wlp, server, buildType){
	var	file = '../'+ wlp +'/www/js/phonegapApi.js',
  		index = '../'+ wlp +'/www/index.html',	
  		server = server,
		config = require('./tokens.json'),		
		configFile = '../'+ wlp + '/www/' + (wlp == 'uLink' ? 'js/config.json' : wlp + '/js/config.json'),
		wlp = wlp == 'uLink' ? 'Uniteller' : wlp,  
		data = config[server],
		SERVER_NAME = data.SERVER_NAME,
		AUTHENTICATION_CODE = data[wlp].AUTHENTICATION_CODE,
		AUTHENTICATION_TOKEN = data[wlp].AUTHENTICATION_TOKEN,
		PARTNER_CODE = data[wlp].PARTNER_CODE;

		
		var data = readFileSync(file);
		var result;
		if(buildType == 'release'){
			result = data.replace(/\"WLP_NAME\": \"[A-Za-z]+/, '"WLP_NAME": "' + wlp)
						 .replace(/\/\/console.log =/, 'console.log =')
						 .replace(/sandbox/g, 'production');
		}else{
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
		result = data.replace(/\"AUTHENTICATION_CODE\": \"[A-Za-z0-9]+/, '"AUTHENTICATION_CODE": "' + AUTHENTICATION_CODE)
					 .replace(/\"AUTHENTICATION_TOKEN\": \".+/, '"AUTHENTICATION_TOKEN": "' + AUTHENTICATION_TOKEN + '",')
					 .replace(/\"SERVER_NAME\": \".+/, '"SERVER_NAME": "' + SERVER_NAME + '",')
					 .replace(/\"PARTNER_CODE\": \"[A-Za-z]+/, '"PARTNER_CODE": "' + PARTNER_CODE);

	  //  console.log(result);
		writeFileSync(configFile, result);

	}


	function removeExtraFiles(app_name){
		var path = require("path"),
			p = "../"+app_name+"/www",
			p1 = "../"+app_name+"/www/js",
			exclude = ['build', 'css', 'fonts', 'js', 'cordova', 'index.html', '.svn'],
			excludeJs = ['bootstrap.min.js', 'hammer.js', 'jquery.maskedinput.min.js', 'jquery.min.js', 'lodash.js', 'sweetalert.min.js', 'link-initialize.js'],
			folder = app_name,
			wlpFolder = '';

	if(folder == 'uLink'){
		folder = 'images';
	}else{
		wlpFolder = p + '/' + folder + '/js';
	}
	console.log('==============>'+folder);
	exclude.push(folder);
	
	removeFiles(p, exclude);
	removeFiles(p1, excludeJs);

	if(wlpFolder){
		removeFiles(wlpFolder, []);
	}
	
	function removeFiles(p, ex){
		fs.readdir(p, function (err, files) {
				if (err) {
						throw err;
				}
				files.forEach(function (file) {
					if(ex.indexOf(file) == -1){
						console.log('Files deleted: '+file.replace(p, ""));
						file = path.join(p, file);
						fs.statSync(file).isFile() ? fs.unlinkSync(file) : rimraf.sync(file);	
					}
				});
		});

	}
}
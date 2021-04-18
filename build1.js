var http = require("http");
var express = require('express');
var fs = require('fs');
var copy = require('recursive-copy');
var app = express();
var bodyParser = require('body-parser');
const { execSync, exec } = require('child_process');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
const rimraf = require('rimraf');
var path = require("path");
var spawn = require('child_process').spawn;


var server = http.createServer(app);

var io = require('socket.io')(server);;

server.listen(8086);

app.get('/form1', function (req, res) {
    console.log(111111);
	res.sendFile(path.join(__dirname + '/index.htm'));

});

app.get('/', function (req, res) {

	res.sendFile(path.join(__dirname + '/index.htm'));

});

var mySocket = null;

function my_exec(command, success, error, showLog) {
	console.log('start running....' + command);
	var proc = exec(command);

	var list = [];
	proc.stdout.setEncoding('utf8');

	proc.stdout.on('data', function (chunk) {
		showLog ? log(chunk.toString()) : list.push(chunk);
	});

	proc.stderr.on('data', function (chunk) {
		showLog ? log(chunk.toString()) : list.push(chunk);
	});

	proc.stdout.on('end', function () {
		console.log('stop running....' + command);
		success(list.join());
	});

	proc.stdout.on('error', function () {
		error();
	});
}

function asyncTask(task, showLog) {

	return new Promise(function (resolve, reject) {
		my_exec(task, resolve, reject, showLog);
	}).catch(function(error){
		console.log(error.message);
	});
}

function asyncFunction(fun) {
	return new Promise(function (resolve, reject) {
		fun();
	}).catch(function(error){
		console.log(error.message);
	});
}

function removeWLPFolder(projectFolder){


	var wlps = ['agente', 'bantrab', 'Interbank', 'ofbank', 'smart'];
	var index = wlps.indexOf(projectFolder.replace('Android', ''));

	index !== -1 && wlps.splice(index, 1);

	wlps.forEach(folder => {
		rimraf.sync(`../${projectFolder}/src/${folder}`);
		console.log(`../${projectFolder}/src/${folder}`)
	});
	

}


function* preWebpack(branch, projectFolder) {

	let cmd = yield removeAllFiles(branch, projectFolder);
	log('Running command:' + cmd);

	let buildType = yield asyncTask(cmd);
	log('Removing wlp folder....');

	yield removeWLPFolder(projectFolder);

	log('wlp folder removed.');

	log('Creating webpack file:');
	let server = yield createWebpackconfigFile(projectFolder, buildType);
	log('Pointing to:' + server);
	let webpack = yield updateJs(projectFolder, server, buildType);
	log('Running command:' + webpack);
	yield asyncTask(webpack);

}

function* buildDebug(cmd) {
	log('Running.... ' + cmd);
	let cordovaRun = yield asyncTask(cmd, true);

	log('Running.... ' + cordovaRun);
	yield asyncTask(cordovaRun, true);
}

function* buildRelease(projectFolder) {
	log('increament version.... ');
	let cordovaPrepareCmd = yield incrementConfigVersion(projectFolder);

	let cordovaRun = yield asyncTask(cordovaPrepareCmd, true);

	log('Running.... ' + cordovaRun);
	yield asyncTask(cordovaRun, true);

}

// function* fabricUpload(cmd){

// 	log('Running.... ' + cmd);
// 	let cordovaRun = yield asyncTask(cmd, true);

// 	log('Running.... ' + cordovaRun);
// 	yield asyncTask(cordovaRun, true);

// }

function* openBrowser(cmd){

	log('Running.... ' + cmd);
	let cordovaRun = yield asyncTask(cmd, true);

	log('Running.... ' + cordovaRun);
	yield asyncTask(cordovaRun, true);

}

function* runFastlane(cmd){

	log('Running.... ' + cmd);
	let cordovaRun = yield asyncTask(cmd, true);

	log('Running.... ' + cordovaRun);
	yield asyncTask(cordovaRun, true);
}

function* prepareAndGenerateArchive(cmd){

	log('Running.... ' + cmd);
	let cordovaRun = yield asyncTask(cmd, true);

	log('Running.... ' + cordovaRun);
	yield asyncTask(cordovaRun, true);

}

function* installIpa(cmd){

	log('Running.... ' + cmd);
	let cordovaRun = yield asyncTask(cmd, true);

	log('Running.... ' + cordovaRun);
	yield asyncTask(cordovaRun, true);

}

function Log(socket) {
	return function (message) {
		LOG(socket, message);
	}

}

// Emit welcome message on connection
io.on('connection', function (socket) {
	console.log('Client connected...');
	log = Log(socket);


	socket.on('okay', function (data) {
		let { branch, platform, projectFolder, buildType = 'debug', server, actions, message, emails } = data;
		// if (actions == 'delete') {
		// 	removeExtraFiles(wlp);
		// }
		var App_Name = {
			Interbank: "Remesa Perú",
			smart: "Smart world",
			agente: "Atlantida",
			ofbank: "OF Bank",
			bantrab: "Remesas BT",
			uLink: "uLink"
        }
        
        if (actions == 'ulinkAndroidUAT') {
            let it = ulinkAndroidUAT(projectFolder, branch, buildType, server, platform, message, emails, App_Name);
            it.next().value.then(function() {
            	log("Second action");
            	it.next()
            });
        }

		if (actions == 'install') {
			if(platform == 'Android'){
				asyncTask(`cd ../${projectFolder} && echo ctpl123 | sudo -S cordova run android --device`, true);
			}
			else{

				let unsignedIpa = `cd ../${projectFolder}/platforms/ios/ && xcodebuild -exportArchive -archivePath "build/${App_Name[projectFolder]}.xcarchive" -exportOptionsPlist exportOptionsDev.plist -exportPath build`;

				let it = installIpa(unsignedIpa);
					it.next(unsignedIpa).value
						.then(function (data) {
							log(data.toString());
							let installIpa = `cd ../${projectFolder}/platforms/ios/build/  && ipa-deploy "${App_Name[projectFolder]}.ipa"`;
							it.next(installIpa).value.then(function (data) {
								log(data.toString());
							}).catch(function (data) {
								log(data.toString());
							});
						}).catch(function (data) {
							log(data.toString());
						});
			}
		}	

		if (actions == 'prepare') {
			actionPrepare(projectFolder, platform, App_Name);
		}

		if (actions == 'clean') {
			if(platform == 'Android'){
				asyncTask(`cd ../${projectFolder} && echo ctpl123 | sudo -S cordova clean android`, true);
			}
			else{
				asyncTask(`cd ../${projectFolder} && echo ctpl123 | sudo -S cordova clean ios`, true);
			}
		}

		if (actions == 'signed'){
			actionSigned(projectFolder, platform, App_Name);
		}

		if (actions == 'increment'){
			rimraf.sync('../' + projectFolder + '/www/build/bundle.js.map');
			console.log('deleted build.map.js file');
			incrementConfigVersion(projectFolder);
		}

		// if (actions == 'build') {
		// 	let cordovaPrepareCmd = `cd ../${projectFolder} && echo ctpl123 | sudo -S cordova prepare android`;
		// 	if (buildType == 'release') {
		// 		let cmd = `cd ../${projectFolder} && cordova build android --release`;
		// 		let it = buildRelease(projectFolder);
		// 		it.next();

		// 		it.next(cordovaPrepareCmd).value
		// 			.then(function (data) {
		// 				log(data.toString());
		// 				it.next(cmd).value.then(function (data) {
		// 					log(data.toString());
		// 				});
		// 			});
		// 	} else {

		// 		let it = buildDebug(cordovaPrepareCmd);
		// 		it.next(cordovaPrepareCmd).value
		// 			.then(function (data) {
		// 				log(data.toString());
		// 				let cmd = `cd ../${projectFolder} && echo ctpl123 | sudo -S cordova build android`;
		// 				it.next(cmd).value.then(function (data) {
		// 					log(data.toString());
		// 				}).catch(function (data) {
		// 					log(data.toString());
		// 				});
		// 			}).catch(function (data) {
		// 				log(data.toString());
		// 			});
		// 	}

		// }

		if (actions == 'submit') {
			actionSubmit(projectFolder, branch, buildType, server)
		}

		if(actions == 'fabric'){
            actionFabric(projectFolder, platform, message, emails);
		}

		if(actions == 'playstore'){

			if(platform == 'Android'){
				asyncTask(`cd ../${projectFolder + '/platforms/android'} && fastlane upload_to_playstore`, true);
			}
			else{
				asyncTask(`cd ../${projectFolder + '/platforms/ios'} && fastlane upload_to_playstore`, true);
			}
	
		}

		if(actions == 'browser'){
			
			let cordovaKillCmd = `cd ../${projectFolder} && ps -ef | grep 8090 | awk 'END{print $2}' | xargs kill -9`;

			let it = openBrowser(cordovaKillCmd);
				it.next(cordovaKillCmd).value
					.then(function (data) {
						log(data.toString());
						log('Open: <a href="http://localhost:8090/webpack-dev-server/" target="_blank">Open Link</a>');
						let cordovaOpenCmd = `cd ../${projectFolder} && npx webpack-dev-server --port=8090`;
						it.next(cordovaOpenCmd).value.then(function (data) {
							log(data.toString());
							//log('Open: <a href="http://localhost:8090/webpack-dev-server/" target="_blank">Open Link</a>');
						}).catch(function (data) {
							log(data.toString());
						});
					}).catch(function (data) {
						log(data.toString());
					});
			
		}


	})

 

});

function actionSubmit(projectFolder, branch, buildType, server) {
    var source = '../' + projectFolder;
    console.log(branch);
    //var svn  = `cd ${source} && svn ${branch ? `co ${branch} .` : 'up'}`;
    var svn = `cd ${source} && svn co ${branch} .`;
    // function generator
    var it = preWebpack(branch, projectFolder);

    // Remove file if required
    it.next();
    //it.next();
    //Run svn
    it.next(svn).value
        .then(function () {

            it.next();
            // create and copy webpack config file
            it.next(buildType);

            // Updating index, config and phonegapApi file.
            it.next(server);

            // Running webpack
            var cmdWebpack = server === 'PROD' ? 'webpack -p' : 'webpack';
            it.next(`cd ../${projectFolder} && ${cmdWebpack}`).value.then(function (data) {
                log(data.toString());
                log('Open: <a href="http://localhost/Fluxxor/' + projectFolder + '/www/" target="_blank">Open Link</a>');
            });
        });
}
function actionPrepare(projectFolder, platform, App_Name) {
    if(platform == 'Android'){
        asyncTask(`cd ../${projectFolder} && echo ctpl123 | sudo -S cordova prepare android`, true);
    }
    else{

        let prepareIos = `cd ../${projectFolder} && echo ctpl123 | sudo -S cordova prepare ios`;

        let it = prepareAndGenerateArchive(prepareIos);
            it.next(prepareIos).value
                .then(function (data) {
                    log(data.toString());
                    let generateArchive = `cd ../${projectFolder}/platforms/ios/ && xcodebuild -workspace "${App_Name[projectFolder]}.xcworkspace" -scheme "${App_Name[projectFolder]}" -sdk iphoneos -configuration AppStoreDistribution archive -archivePath "build/${App_Name[projectFolder]}.xcarchive"`;
                    it.next(generateArchive).value.then(function (data) {
                        log(data.toString());
                    }).catch(function (data) {
                        log(data.toString());
                    });
                }).catch(function (data) {
                    log(data.toString());
                });
    }
    
}
function actionSigned(projectFolder, platform, App_Name) {
    if(platform == 'Android'){
        asyncTask(`cd ../${projectFolder} && echo ctpl123 | sudo -S cordova build android --release`, true);
    }
    else{
        asyncTask(`cd ../${projectFolder}/platforms/ios/ && xcodebuild -exportArchive -allowProvisioningUpdates -archivePath "build/${App_Name[projectFolder]}.xcarchive" -exportOptionsPlist exportOptionsAdhoc.plist -exportPath build`, true);
    }
}
function actionFabric(projectFolder, platform, message, emails) {
    notesFile(projectFolder, message);
    fastFile(projectFolder, emails, platform);

    if(platform == 'Android'){
        let fastlanePluginCmd = `cd ../${projectFolder + '/platforms/android'} && echo ctpl123 | sudo -S fastlane add_plugin firebase_app_distribution`;

        let it = runFastlane(fastlanePluginCmd);
            it.next(fastlanePluginCmd).value
                .then(function (data) {
                    log(data.toString());
                    let fastlaneMainCmd = `cd ../${projectFolder + '/platforms/android'} && echo ctpl123 | sudo -S fastlane distribute`;
                    it.next(fastlaneMainCmd).value.then(function (data) {
                        log(data.toString());
                    }).catch(function (data) {
                        log(data.toString());
                    });
                }).catch(function (data) {
                    log(data.toString());
                });
    }
    else{
        let fastlanePluginCmd = `cd ../${projectFolder + '/platforms/ios'} && echo ctpl123 | sudo -S fastlane add_plugin firebase_app_distribution`;

        let it = runFastlane(fastlanePluginCmd);
            it.next(fastlanePluginCmd).value
                .then(function (data) {
                    log(data.toString());
                    let fastlaneMainCmd = `cd ../${projectFolder + '/platforms/ios'} && echo ctpl123 | sudo -S fastlane ios distribute`;
                    it.next(fastlaneMainCmd).value.then(function (data) {
                        log(data.toString());
                    }).catch(function (data) {
                        log(data.toString());
                    });
                }).catch(function (data) {
                    log(data.toString());
                });
    }
}

function* ulinkAndroidUAT(projectFolder, branch, buildType, server, platform, message, emails, App_Name) {
	log("Started ulinkAndroidUAT");
	log("Starting actionSubmit...");
    yield asyncFunction(function() {
    	actionSubmit(projectFolder, branch, buildType, server)
    });
    // yield asyncTask(submit);
    log("Starting actionPrepare...");
    yield asyncFunction(function() {
    	actionPrepare(projectFolder, platform, App_Name)
    });
    // yield asyncTask(prepare);
    log("Starting actionSigned...");
    let signed = yield actionSigned(projectFolder, platform, App_Name);
    // yield asyncTask(signed);
    log("Starting actionFabric...");
    let fabric = yield actionFabric(projectFolder, platform, message, emails);
    // yield asyncTask(fabric);
    log("Finished ulinkAndroidUAT");
}

function createWebpackconfigFile(projectFolder, buildType = 'debug') {
	var wlp = projectFolder.replace("Android", "");
	var webpackConfigFile = '../' + projectFolder + (buildType === 'release' ? '/webpack.config.release.js' : '/webpack.config.js');
	var commonWebpackFile = buildType === 'release' ? 'webpack.config.common.release.js' : 'webpack.config.common.js';
	var data = readFileSync(commonWebpackFile);
	var APP_NAME = wlp === 'uLink' || wlp === 'uLinkDev' ? 'Uniteller' : wlp;
	data = data.toString()
		.replace(/APP_NAME/, APP_NAME)
		.replace(/SERVER/, server);
	writeFileSync(webpackConfigFile, data);
}

function LOG(sc, message) {
	sc.emit('message', { message: message, id: sc.id });
}


function createReleaseSignFile(projectFolder) {
	var dir = '../' + projectFolder + '/platforms/android/',
		store = require('./store.json')[projectFolder],
		file = 'release-signing.properties';

	if (!fs.existsSync(dir + file)) {
		// Do something
		console.log('creating release signed file.');
		var data = readFileSync(file);
		data = data.toString()
			.replace(/KEYSTORE_FILE_PATH/, store.KEYSTORE_FILE_PATH)
			.replace(/KEYSTORE_PASSWORD/, store.KEYSTORE_PASSWORD)
			.replace(/KEY_ALIAS/, store.KEY_ALIAS)
			.replace(/KEY_PASSWORD/, store.KEY_PASSWORD);
		writeFileSync(dir + file, data);
	}
}

function removeAllFiles(branch, dir) {
	if (branch) {
		rimraf.sync('../' + dir + '/.svn');
		rimraf.sync('../' + dir + '/www');
		rimraf.sync('../' + dir + '/src');
		rimraf.sync('../' + dir + '/platforms/android/app/src/main/assets/www/.svn');
		rimraf.sync('../' + dir + '/platforms/android/assets/www/.svn');
		log('Files deleted!!!');;
	} else {
		log('No files deleted!!!');;
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

function incrementConfigVersion(projectFolder, ver = 'patch') {
	
	var configFile = '../' + projectFolder + '/config.xml',
		fs = require('fs'),
		xml2js = require('xml2js'),
		parser = new xml2js.Parser(),
		xmlBuilder = new xml2js.Builder();

	//console.log(configFile);
	fs.readFile(configFile, function (err, data) {
		if (err) {
			console.log('error: ' + err);
		} else {
			//console.log(data);
			parser.parseString(data, function (err, result) {
				let versionArray = result.widget.$.version.split('.');
				if (ver === 'major') {
					versionArray[0] = parseInt(versionArray[0]) + 1;
				}
				else if (ver === 'minor') {
					versionArray[1] = parseInt(versionArray[1]) + 1;
				}
				else if (ver === 'patch') {
					versionArray[2] = parseInt(versionArray[2]) + 1;
				}
				result.widget.$.version = versionArray.join('.');

				var xml = xmlBuilder.buildObject(result);

				fs.writeFile(configFile, xml, function(err) {
					if(err) {
						console.log(err);
					}
					console.log("Succesfully incremented");
					log('Succesfully incremented version and bundle.map.js file deleted');
				});

			});
		}

	});
}

function updateJs(projectFolder, server, buildType = 'debug') {
	//console.log(require('./tokens.json')[server]);
	var wlp = projectFolder.replace('Android', '');
	var file = '../' + projectFolder + '/src/js/phonegapApi.js',
		index = '../' + projectFolder + '/www/index.html',
		server = server,
		config = require('./tokens.json'),
		configFile = '../' + projectFolder + '/src/' + (wlp == 'UnitellerDev' || wlp == 'uLink' || wlp == 'DemoUniteller' ? 'js/config.json' : wlp + '/js/config.json'),
		wlp = wlp == 'UnitellerDev' || wlp == 'uLink' || wlp == 'DemoUniteller' ? 'Uniteller' : wlp,
		data = config[server],
		SERVER_NAME = data.SERVER_NAME,
		AUTHENTICATION_CODE = data[wlp].AUTHENTICATION_CODE,
		AUTHENTICATION_TOKEN = data[wlp].AUTHENTICATION_TOKEN,
		PARTNER_CODE = data[wlp].PARTNER_CODE;

	var wlpName = {
		Interbank: "Interbank",
		smart: "Smart World",
		agente: "Atlantida",
		ofbank: "OF Bank",
		bantrab: "Remesas BT",
		uLink: "uLink",
		Uniteller: "uLink"
	}

	// update phonegapApi js file.
	var data = readFileSync(file);
	var result;
	if (buildType == 'release' || server == 'PROD') {
		console.log(wlp);
		result = data.replace(/\"WLP_NAME\": \"[A-Za-z]+/, '"WLP_NAME": "' + wlp)
			.replace(/\/\/console.log =/, 'console.log =')
			.replace(/plaidClientName: \"[A-Za-z\s]+/, 'plaidClientName: "' + wlpName[wlp])
			.replace(/sandbox/g, 'production');
	} else {
		console.log(wlp);
		result = data.replace(/\"WLP_NAME\": \"[A-Za-z]+/, '"WLP_NAME": "' + wlp)
					 .replace(/production/g, 'sandbox')
					 .replace(/plaidClientName: \"[A-Za-z\s]+/, 'plaidClientName: "' + wlpName[wlp]);
	}

	writeFileSync(file, result);

	// update index html file.
	data = readFileSync(index);
	result = data.replace(/http(s?):\/\/[A-Za-z\.:0-9]+\//, SERVER_NAME);
	writeFileSync(index, result);

	// update config json file;
	data = readFileSync(configFile);
	configJson = JSON.parse(data);
	configJson.AUTHENTICATION_CODE = AUTHENTICATION_CODE;
	configJson.AUTHENTICATION_TOKEN = AUTHENTICATION_TOKEN;
	configJson.SERVER_NAME = SERVER_NAME;
	configJson.PARTNER_CODE = PARTNER_CODE;


	/* result = data.replace(/\"AUTHENTICATION_CODE\": \"[A-Za-z0-9]+/, '"AUTHENTICATION_CODE": "' + AUTHENTICATION_CODE)
				 .replace(/\"AUTHENTICATION_TOKEN\": \".+/, '"AUTHENTICATION_TOKEN": "' + AUTHENTICATION_TOKEN + '",')
				 .replace(/\"SERVER_NAME\": \".+/, '"SERVER_NAME": "' + SERVER_NAME + '",')
				 .replace(/\"PARTNER_CODE\": \"[A-Za-z]+/, '"PARTNER_CODE": "' + PARTNER_CODE); */

	//  console.log(result);
	writeFileSync(configFile, JSON.stringify(configJson));

}

function notesFile(projectFolder, message) {

	//var path = "c:\\Temp\\Test.txt";
	var source = '../' + projectFolder+ '/release_notes.txt' ;
	var path = source.toString();

	  fs.open(path,'w+',function(err, fd){
		if (err) {
			console.log(err);
		} else {
			fs.writeFile(path, message, function(err) {
				if(err) {
					console.log(err);
				}
				console.log("Release notes successfully added");
			});
		}
	  });
	  
}

function fastFile(projectFolder, emails, platform){
	if(platform == 'Android'){
		var source = '../' + projectFolder + '/platforms/android/fastlane/Fastfile' ;
	}
	else{
		var source = '../' + projectFolder + '/platforms/ios/fastlane/Fastfile' ;
	}
	var path = source.toString();

	fs.readFile(path, 'utf8', function (err,data) {
		if (err) {
		  return console.log(err);
		}
		emails = emails || 'mayankg@cognam.com';
		var result = data.replace("EMAILS", emails);
	  
		fs.writeFile(path, result, 'utf8', function (err) {
		   if (err) return console.log(err);
		   console.log("Emails added successfully");
		});
	  });
}

function revertFastFile(projectFolder, emails){
	var source = '../../../' + projectFolder + '/platforms/android/fastlane/Fastfile' ;
	var path = source.toString();

	fs.readFile(path, 'utf8', function (err,data) {
		if (err) {
		  return console.log(err);
		}
	
		var result = data.replace(emails, "EMAILS");
	  
		fs.writeFile(path, result, 'utf8', function (err) {
		   if (err) return console.log(err);
		   console.log("Emails reverted successfully");
		});
	  });
}

/*
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
*/
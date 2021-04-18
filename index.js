var http = require("http");
var express = require('express');
var fs = require('fs');
var copy = require('recursive-copy');
var app = express();
var bodyParser = require('body-parser');
const { exec } = require('child_process');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
 
// Running Server Details.
var server = app.listen(8082, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening at %s:%s Port", host, port);
});
 

app.get('/form', function (req, res) {
  var html='';
  html +="<body>";
  html += "<form action='/thank'  method='post' name='form1'>";
  html += "<p>Branch:<select name='branch'><option value='uLink'>Master</option><option value='refer_a_friend'>Refer a Friend</option></select></p>";
  html += "UserName:<select name='username'><option value='ganesh'>Ganesh</option><option value='jatin'>Jatin</option><option value='naushad'>Naushad</option></select>";
  html += "<p>SERVER NAME:<select name='server'><option value='UAT'>UAT</option><option value='uat2'>UAT2</option><option value='LOCAL'>orapitest@62</option><option value='UNIRTEST'>unirtest@64</option><option value='UNIRCOGNAM'>unirtest@82</option><option value='gserver'>10.72.15.76</option><option value='uat2'>10.72.12.209</option></select></p>";
  html += "<p>WLP NAME:<select name='WLP'><option value='Uniteller'>uLink</option><option value='smart'>Smart</option><option value='mlhuillier'>M.lhuillier</option><option value='Interbank'>Interbank</option><option value='agente'>Atlantida</option></select></p>";
  html += "<input type='submit' value='submit'>";
  html += "<INPUT type='reset'  value='reset'>";
  html += "</form>";
  html += "</body>";
  res.send(html);
});
 
app.post('/thank', urlencodedParser, function (req, res){
	var dir = '../'+req.body.username,
		source = '../'+ req.body.branch;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  console.log('cd '+source+ ' && svn up');
  exec('cd '+source+ ' && svn up', function(){
  	copy(source, dir, {overwrite: true})
  .then(function(results){
  	console.info('Copied ' + results.length + ' files');

  	var webpackConfigFile = "../"+req.body.username+"_webpack.config.js";
  		if (!fs.existsSync(webpackConfigFile)){
	        fs.readFile('../webpack.config.common.js', function(err, data){
	        	if(err){
	        		console.log("error while reading file "+ err);
	        	}else{
	        		var data = data.toString().replace(/!!/g, req.body.username);
	        		
	        		fs.writeFile(webpackConfigFile, data, function(err) {
					    if(err) {
					        return console.log(err);
					    }

					    console.log("The file was saved!");
					}); 
	        	}
	        });
    	}
    	console.log('cd .. && node updateJs.js '+ req.body.WLP + ' ' +req.body.server + ' '+ req.body.username+ ' && webpack --config='+req.body.username+'_webpack.config.js');
    	exec('cd .. && node updateJs.js '+req.body.WLP+ ' ' +req.body.server+ ' '+ req.body.username +' && webpack --config='+req.body.username+'_webpack.config.js', function(err, stdout, stderr){
		  if (err) {
		    // node couldn't execute the command
		    return;
		  }
		  console.log('End executing CMD: webpack --'+webpackConfigFile);
		  // the *entire* stdout and stderr (buffered)
		  console.log(`stdout: ${stdout}`);
		  console.log(`stderr: ${stderr}`);
		  if(!stderr){
		  	res.writeHead(302, {
			  'Location': 'http://10.72.15.94/Fluxxor/branches/'+req.body.username+'/'
			  //add other headers here...
			});
			res.end();
		  }
		});
  });

  });
 
  

  
 });
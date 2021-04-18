var fs = require('fs'),
	file = 'www/js/phonegapApi.js',
  index = 'www/index.html';
	wlp = process.argv[2],
  server = process.argv[3],
  config = require('./tokens.json');
  dir = 'www/' + (wlp == 'Uniteller' ? 'js/config.json' : wlp + '/js/config.json'),
  data = config[server],
  SERVER_NAME = data.SERVER_NAME,
  AUTHENTICATION_CODE = data[wlp].AUTHENTICATION_CODE,
  AUTHENTICATION_TOKEN = data[wlp].AUTHENTICATION_TOKEN,
  PARTNER_CODE = data[wlp].PARTNER_CODE;

fs.readFile(file, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }

  if(wlp == 'Uniteller'){
    wlp1 = uLink;
  }
  else{
    wlp1 = wlp;
  }

  var result = data.replace(/\"WLP_NAME\": \"[A-Za-z]+/, '"WLP_NAME": "' + wlp)
                   .replace(/\/\/console.log =/, 'console.log =')
                   .replace(/sandbox/g, 'production')
                   .replace(/\"plaidClientName:\" \"[A-Za-z\\s]+/, '"plaidClientName": "' + wlp1)

  fs.writeFile(file, result, 'utf8', function (err) {
     if (err) return console.log(err);
     console.log('PhonegapApi file is updated.');
  });
});

fs.readFile(index, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/https:\/\/[A-Za-z\.:0-9]+\//, SERVER_NAME);
 //console.log(result);
  fs.writeFile(index, result, 'utf8', function (err) {
     if (err) return console.log(err);
     console.log('index file is updated.');
  });
});

console.log(AUTHENTICATION_TOKEN);
fs.readFile(dir, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/\"AUTHENTICATION_CODE\": \"[A-Za-z0-9]+/, '"AUTHENTICATION_CODE": "' + AUTHENTICATION_CODE)
                   .replace(/\"AUTHENTICATION_TOKEN\": \".+/, '"AUTHENTICATION_TOKEN": "' + AUTHENTICATION_TOKEN + '",')
                   .replace(/\"SERVER_NAME\": \".+/, '"SERVER_NAME": "' + SERVER_NAME + '",')
                   .replace(/\"PARTNER_CODE\": \"[A-Za-z]+/, '"PARTNER_CODE": "' + PARTNER_CODE);

  fs.writeFile(dir, result, 'utf8', function (err) {
     if (err) return console.log(err);
     console.log('config file is updated.');
  });
});
var http = require("http");
var domain = 'https://api.dropboxapi.com';

// prepare the header
var postheaders = {
    'Content-Type' : 'application/json',
    'Authorization' : 'Bearer XawczATPkRAAAAAAAAAApjalAtOtrpoDDC9PF0du8aYhT8-Gg_FAvFZ-YUPooA31',

};

module.export = {
    postheaders = {
        'Content-Type' : 'application/json',
        'Authorization' : 'Bearer XawczATPkRAAAAAAAAAApjalAtOtrpoDDC9PF0du8aYhT8-Gg_FAvFZ-YUPooA31',
    
    },
    options: {
        host:domain,
            port: 80,
            path: '/2/files/get_temporary_link',
            method: 'POST',
            headers : this.postheaders
    },
    callApi: function(url, data, cb){
        this.options.path = url;
        this.options.data = data;
        http.request(this.options, cb).end();
    },
    uploadFile: function(request, cb, filename){
      var curl =   `curl -X POST https://content.dropboxapi.com/2/files/upload
 --header "Authorization: Bearer XawczATPkRAAAAAAAAAAq7WHRFkh3dld-r3AKsLQG2R7GnTUwHC3T5Mk000JMPvK" --header "Dropbox-API-Arg: {\"p
ath\": \"/FILE_NAME\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}" --header "Content-Type: applicatio
n/octet-stream" --data-binary @FILE_NAME`;

        return curl.replace(/"FILE_NAME"/g, filename);
        // this.postheaders['Content-Type'] = 'application/octet-stream';
        // this.callApi('/2/files/upload', request, cb);
    },
    getTempLink: function(request, cb){
        this.postheaders['Content-Type'] = 'application/json';
        this.callApi('/2/files/get_temporary_link', request, cb);
    }
}

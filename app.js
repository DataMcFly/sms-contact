var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var twilio = require('twilio');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({	extended: true	}));
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users
 
var port = process.env.PORT || 8080; // set our port

var client = twilio('ACCOUNTSID', 'AUTHTOKEN');
var twilio_number = 'YOUR-NUMBER';

var api_key = "YOUR-API-KEY";
var db = "callcenter";
var collection = "sms-contact";

var messagesRef = require('datamcfly').init(db, collection, api_key);

app.post('/message', function (request, response) {
	var d = new Date();
	var date = d.toLocaleString();

	messagesRef.push({
		sid: request.param('MessageSid'),
		type:'text',
		direction: "inbound",
		tstamp: date,
		fromNumber:request.param('From'),
		textMessage:request.param('Body'),
		fromCity:request.param('FromCity'),
		fromState:request.param('FromState'),
		fromCountry:request.param('FromCountry')
	});
	var twiml = new twilio.TwimlResponse().message('Thanks for the message, an agent will get back to you shortly.');
	response.send( twiml );
});

app.post('/reply', function (request, response) {
	var d = new Date();
	var date = d.toLocaleString();

	messagesRef.push({
		type:'text',
		direction: "outbound",
		tstamp: date,
		fromNumber:request.param('To'),
		textMessage:request.param('Body'),
		fromCity:'',
		fromState:'',
		fromCountry:''
	});

	client.sendMessage( {
		to:request.param('To'), 
		from:twilio_number,
		body:request.param('Body')
	}, function( err, data ) {
		console.log( data.body );
	});
});

// frontend routes =========================================================

// route to handle all angular requests
app.get('*', function(req, res) {
	res.sendfile('./public/index.html');
});

 
var server = app.listen(port, function() {
	console.log('Listening on port %d', server.address().port);
});

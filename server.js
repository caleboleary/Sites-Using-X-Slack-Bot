var Botkit = require('botkit');
var fs = require('fs');

// fixing heroku sleep problem
	var handle, http, request, server, strobe;
	http = require('http');
	request = require('request');
	strobe = function() {
		return request('http://sites-using-bot.herokuapp.com/', function(e, r, b) {});
	};
	(function() {
		setInterval(strobe, 25 * 60 * 1000);
		return console.log("I am up!!");
	})();
	handle = function(req, res) {
		return res.end("42");
	};
	server = http.createServer(handle);
	server.listen(process.env.PORT || 5000);
// fixing heroku sleep problem

//trying to connect to mongo --------------------------------------------------------
//------------------------------------------------------------------------
//-------------------------------------------------------------
//define feature type:
var mongoose = require('mongoose');
mongoose.connect('mongodb://heroku_qptzk3gw:lrbpadunfm6k749m5i6rhsa8gh@ds011734.mlab.com:11734/heroku_qptzk3gw');
var Schema = mongoose.Schema;
var featureSchema = new Schema({
	name: { type: String, required: true, unique: true },
	links: Array
});
var Feature = mongoose.model('Feature', featureSchema);

function addFeature(newFeature){
	var addFeature = new Feature({
		name: newFeature.name,
		links:newFeature.links
	});
	addFeature.save(function(err){
		if (err) throw err;
		console.log('feature added to DB');
	});
}
function updateFeature(editedFeature){
	Feature.find({ name: editedFeature.name }, function(err, feature) {
		if (err) throw err;
		feature[0].links = editedFeature.links;		
		feature[0].save(function(err){
			if (err) throw err;
			console.log('user successfully updated');
		});
	});
}
//-------------------------------------------------------------
//------------------------------------------------------------------------
//trying to connect to mongo --------------------------------------------------------


var controller = Botkit.slackbot({
	debug: true
});

//some vars
var bot_name = 'sites_using_bot';
var admin_reporting = 'U06GTUMU6';
var private_reporting = true;
var api_key = 'xoxb-49265497734-A64Seq8aDymm6tFqtZYnE46k';

//some functions
function helpInfo(bot,message) {
	message.unfurl_links = false;
	message.unfurl_media = false;
	bot.reply(message, {text:'Sites Using Bot Help:\nList examples:`@'+bot_name+' FEATURE`\nAdd example:`@'+bot_name+' http://miva.com uses FEATURE`', unfurl_links:false, unfurl_media:false});
}

function listFeatures(bot,message) {
	Feature.find({}, function(err, feature) {
		if (err) throw err;
		var featureList = feature.map(function(arr){return arr.name;});
		bot.reply(message, 'Here are sites that I have examples for: \n```' + featureList.join('\n') + '```');
	});
}

function privateReporting(bot, message, feature, example){
	var pMessage = {user:admin_reporting};
	bot.startPrivateConversation(pMessage, function(err, conversation){
		conversation.say('Someone updated the db: ```'+JSON.stringify({message, feature, message})+'```');
	});
}

function addToDb(feature, example, bot, message){
	message.unfurl_links = false;
	message.unfurl_media = false;
	if (example.indexOf('|') > -1){
		example = example.split('|')[0].replace('<', '');
	}
	Feature.find({name:feature}, function(err, foundFeature) {
		if (foundFeature.length < 1) {
			//add
			var toAdd = {name:feature, links:[example]};
			addFeature(toAdd);
			bot.reply(message, {text:'Thanks! I\'ve added `'+feature+'` to my features list, and added `'+example+'` as the first example.', unfurl_links:false, unfurl_media:false});
		}
		else {
			foundFeature[0].links.push(example);
			console.log('ff:',foundFeature[0]);
			updateFeature(foundFeature[0]);
			bot.reply(message, {text:'Thanks! I\'ve updated my example links for `'+feature+'` with `'+example+'`', unfurl_links:false, unfurl_media:false});		
		}
		 if (private_reporting) {
			privateReporting(bot, message, feature, example);	
	    }
	});
}

function fetchList(bot, message) {
	message.unfurl_links = false;
	message.unfurl_media = false;
	if (message.text.toLowerCase().indexOf('uses') > -1) {
		//Trying to add to db
		var split = message.text.toLowerCase().replace('add', '').trim().split('uses').map(function(str){return str.trim();});
		addToDb(split[1], split[0], bot, message);
	}
	else {
		//if we're not adding, we must be looking for a feature		
		var responded = false;
		Feature.find({}, function(err, feature) {
			if (err) throw err;
			// console.log(feature);
			for (var i = 0; i < feature.length; i++) {
				if (message.text.toLowerCase().indexOf(feature[i].name)>-1) {
					bot.reply(message, {text:'Looking for sites using `'+feature[i].name+'`? Here you go:\n' +feature[i].links.join('\n'), unfurl_links:false, unfurl_media:false});
					responded = true;
				}
			}
			if (!responded) {
				bot.reply(message, 'Sorry, I wasn\'t able to find any examples for you.\nIf anyone has any examples, please add them to my database in this format: `@'+bot_name+' add example.com uses example feature`');
			}
			else {
				bot.reply(message, 'If anyone has any more examples, please add them to my database in this format: `@'+bot_name+' add example.com uses example feature`');
			}
		});
	}
}

//start it up!
controller.spawn({
	token: api_key,
}).startRTM();

//listeners
// controller.hears(
// 	['are you there?'],
// 	['direct_message', 'direct_mention', 'mention', 'ambient'],
// 	function(bot, message) {
// 		bot.reply(message, 'Yes, I\'m here :thebest:');
// 	}
// );

controller.hears(
	['help'],
	['direct_message', 'direct_mention', 'mention'],
	function(bot, message) {helpInfo(bot, message)}
);
controller.hears(
	['sites using help'],
	['direct_message', 'direct_mention', 'mention', 'ambient'],
	function(bot, message) {helpInfo(bot, message)}
);
controller.hears(
	['list features'],
	['direct_message', 'direct_mention', 'mention'],
	function(bot, message) {listFeatures(bot,message);}
);
controller.hears(
	[''],
	['direct_message', 'direct_mention', 'mention'],
	function(bot, message) {fetchList(bot,message);}
);
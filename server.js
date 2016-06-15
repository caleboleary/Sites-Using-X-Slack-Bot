var Botkit = require('botkit');
var fs = require('fs');

//controller
var controller = Botkit.slackbot({
	debug: true
});

// heroku sleeping fix
var herokuFix = require('./herokuFix.js');
herokuFix.fixit();

//connect to Mongo
var mongoConnect = require('./mongoConnect.js');

//some vars
var bot_name = 'sites_using_bot';
var admin_reporting = process.env.ADMIN_NOTIFICATION_ID;
var private_reporting = true;
var api_key = process.env.SLACK_API_KEY;

//some functions
function helpInfo(bot,message) {
	message.unfurl_links = false;
	message.unfurl_media = false;
	bot.reply(message, {text:'Sites Using Bot Help:\nThis bot will list examples of sites using different software, themes, or features for others to access and update. For example, mention my name (@sites_using_bot) and say \'listrak\' to see examples of sites who use Listrak for their cart abandonment emails. You can talk to the bot in a channel or directly like a real user. Here are some commands:\nList examples of sites using a feature:`@'+bot_name+' FEATURE NAME`\nAdd an example of a site using a feature:`@'+bot_name+' http://miva.com uses FEATURE NAME` \nList Features:`@'+bot_name+' list features`\n :thebest:', unfurl_links:false, unfurl_media:false});
}

function listFeatures(bot,message) {
	mongoConnect.Feature.find({}, function(err, feature) {
		if (err) throw err;
		var featureList = feature.map(function(arr){return arr.name;});
		bot.reply(message, 'Here are features/softwares/themes that I have examples for: \n```' + featureList.join('\n') + '```');
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
	mongoConnect.Feature.find({name:feature}, function(err, foundFeature) {
		if (foundFeature.length < 1) {
			//add
			var toAdd = {name:feature, links:[example]};
			mongoConnect.addFeature(toAdd);
			bot.reply(message, {text:'Thanks! I\'ve added `'+feature+'` to my features list, and added `'+example+'` as the first example.', unfurl_links:false, unfurl_media:false});
		}
		else {
			foundFeature[0].links.push(example);
			mongoConnect.updateFeature(foundFeature[0]);
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
		mongoConnect.Feature.find({}, function(err, feature) {
			if (err) throw err;
			for (var i = 0; i < feature.length; i++) {
				if (message.text.toLowerCase().indexOf(feature[i].name)>-1) {
					bot.reply(message, {text:'Looking for sites using `'+feature[i].name+'`? Here you go:\n' +feature[i].links.join('\n'), unfurl_links:false, unfurl_media:false});
					responded = true;
				}
			}
			if (!responded) {
				bot.reply(message, 'Sorry, I wasn\'t able to find any examples for you.\nIf anyone has any examples, please add them to my database in this format: `@'+bot_name+' example.com uses example feature name`');
			}
			else {
				bot.reply(message, 'If anyone has any more examples, please add them to my database in this format: `@'+bot_name+' example.com uses example feature name`');
			}
		});
	}
}

//start it up!
controller.spawn({
	token: api_key,
}).startRTM();

// listeners
controller.hears(
	['are you there?'],
	['direct_message', 'direct_mention', 'mention', 'ambient'],
	function(bot, message) {
		bot.reply(message, 'Yes, I\'m here :thebest:');
	}
);
controller.hears(
	['help'],
	['direct_message', 'direct_mention', 'mention'],
	function(bot, message) {helpInfo(bot, message);}
);
controller.hears(
	['sites using help'],
	['direct_message', 'direct_mention', 'mention', 'ambient'],
	function(bot, message) {helpInfo(bot, message);}
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
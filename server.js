var Botkit = require('botkit');
var fs = require('fs');

var controller = Botkit.slackbot({
	debug: true
});

//some vars
var bot_name = 'sites_using_bot';
var admin_reporting = 'U0C472TF0';
var private_reporting = true;

//some functions
function helpInfo(bot,message) {
	message.unfurl_links = false;
	message.unfurl_media = false;
	bot.reply(message, {text:'Sites Using Bot Help:\nList examples:`@'+bot_name+' FEATURE`\nAdd example:`@'+bot_name+' add http://miva.com uses FEATURE`', unfurl_links:false, unfurl_media:false});
}

function privateReporting(bot, message){
	var pMessage = {user:admin_reporting};
	bot.startPrivateConversation(pMessage, function(err, conversation){
		conversation.say('Someone updated the db: ```'+JSON.stringify(message)+'```');
	});
}

function addToDb(feature, example, bot, message){
	message.unfurl_links = false;
	message.unfurl_media = false;
	if (example.indexOf('|') > -1){
		example = example.split('|')[0].replace('<', '');
	}
	fs.readFile('examples.json', 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		else {			
			data = JSON.parse(data);
			var found = false;
			for (var i = 0; i < data.matches.length; i++) {
				if (data.matches[i].name == feature.toLowerCase()) {
					found = true;
					if (data.matches[i].links.indexOf(example) < 0) {
						data.matches[i].links.push(example);
					}
					break;
				}
			}
			if (!found) {
				data.matches.push({
					name:feature.toLowerCase(),
					links:[example]
				});
			}
			fs.writeFile("examples.json", JSON.stringify(data), function(err) {
			    if(err) {
			        bot.reply(message, 'Hmm... something went wrong with updating my database.');
			    }
			    else {				    	
				    if (!found) {
						bot.reply(message, {text:'Thanks! I\'ve added `'+feature+'` to my features list, and added `'+example+'` as the first example.', unfurl_links:false, unfurl_media:false});
				    }
				    else {
						bot.reply(message, {text:'Thanks! I\'ve updated my example links for `'+feature+'` with `'+example+'`', unfurl_links:false, unfurl_media:false});			    	
				    }
			    }
			    if (private_reporting) {
					privateReporting(bot, message);	
			    }
			});
		}
	});	
}

function fetchList(bot, message) {
	message.unfurl_links = false;
	message.unfurl_media = false;
	if (message.text.toLowerCase().indexOf('uses') > -1 && message.text.toLowerCase().indexOf('add') > -1) {
		//Trying to add to db
		var split = message.text.toLowerCase().replace('add', '').trim().split('uses').map(function(str){return str.trim();});
		addToDb(split[1], split[0], bot, message);
	}
	else {
		//if we're not adding, we must be looking for a feature		
		var responded = false;
		fs.readFile('examples.json', 'utf8', function (err,data) {
			if (err) {
				return console.log(err);
			}
			data = JSON.parse(data);
			for (var i = 0; i < data.matches.length; i++) {
				if (message.text.toLowerCase().indexOf(data.matches[i].name)>-1) {
					bot.reply(message, {text:'Looking for sites using `'+data.matches[i].name+'`? Here you go:\n' +data.matches[i].links.join('\n'), unfurl_links:false, unfurl_media:false});
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
	token: 'xoxb-48895617910-juAP2eQv9d7HMkWNSyIdZhLf',
}).startRTM();

//listeners
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
	function(bot, message) {helpInfo(bot, message)}
);
controller.hears(
	['sites using help'],
	['direct_message', 'direct_mention', 'mention', 'ambient'],
	function(bot, message) {helpInfo(bot, message)}
);

controller.hears(
	[''],
	['direct_message', 'direct_mention', 'mention'],
	function(bot, message) {fetchList(bot,message);}
);
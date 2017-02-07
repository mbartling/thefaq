/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

require('dotenv').load();

var Botkit = require('botkit');
var express = require('express');
var middleware = require('botkit-middleware-watson')({
    username: process.env.CONVERSATION_USERNAME,
    password: process.env.CONVERSATION_PASSWORD,
    workspace_id: process.env.WORKSPACE_ID,
    version_date: '2016-09-20'
});
/*
   var GoogleSearch = require('google-search');
   var googlesearch = new GoogleSearch({
   key: process.env.GOOGLE_KEY,
   cx: process.env.GOOGLE_CX
   });
   */
var google = require('googleapis');
var customsearch = google.customsearch('v1');

// Add the middleware hook
middleware.after = function(message, conversationPayload, callback) {
    var hasSearch = false;
    for(var i = 0; i < conversationPayload.intents.length; i++)
    {
        if('to_find' == conversationPayload.intents[i]['intent'] || 'support' == conversationPayload.intents[i]['intent'])
        {
            console.log('here')
            hasSearch = true;
        }
    }
    console.log(conversationPayload);
    console.log(message);
    if(hasSearch){
        console.log('Got a query')
        var query = '';
        conversationPayload['entities'].forEach(function(entity){
            console.log(entity['entity'] + ' ' + entity['value']);
            query = query + ' ' + entity['value'] + ' ' + entity['entity']
        });
        //conversationPayload['output']['text'].push(JSON.stringify(conversationPayload))
        console.log(query);
        customsearch.cse.list({ cx: process.env.GOOGLE_CX, q: query, auth: process.env.GOOGLE_KEY }, function (err, resp) {
            if (err) {
                return console.log('An error occured', err);
            }
            // Got the response from custom search
            console.log('Result: ' + resp.searchInformation.formattedTotalResults);
            //conversationPayload['output']['text'].push(JSON.stringify(resp.items))
            //var result = ''
            if (resp.items && resp.items.length > 0 && resp.items.length > 5) {
                for(var i = 0; i < 5; i++){
                    //console.log(resp.items[i].title);
                    console.log(resp.items[i]);
                    //conversationPayload['output']['text'].push(resp.items[i].title + ' ' +resp.items[i].link.toString() + '\n')
                    conversationPayload['output']['text'].push('[' + resp.items[i].title +'](' +resp.items[i].link.toString() + ')\n')
                        //conversationPayload['output']['text'] = '<' + resp.items[i].link.toString() + '>';
                        //result = result + resp.items[i].link + '\n'
                }
                //conversationPayload['output']['text'].push(result)
            }
            console.log(conversationPayload);
            callback(null, conversationPayload);
        });
    }
    else{
        console.log('got something else')
        callback(null, conversationPayload);
    }
}
// Configure your bot.
var slackController = Botkit.slackbot();
var slackBot = slackController.spawn({
    token: process.env.SLACK_TOKEN
});
slackController.hears(['.*'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
    slackController.log('Slack message received');
    middleware.interpret(bot, message, function(err) {
        if (!err)
            bot.reply(message, message.watsonData.output.text.join('\n'));
    });
});

slackBot.startRTM();

// Create an Express app
var app = express();
var port = process.env.PORT || 5000;
app.set('port', port);
app.listen(port, function() {
    console.log('Client server listening on port ' + port);
});

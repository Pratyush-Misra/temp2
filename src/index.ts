// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { config } from 'dotenv';
import * as path from 'path';
import * as restify from 'restify';

import { INodeSocket } from 'botframework-streaming';

import fetch from 'node-fetch';

import NotifyCard from "./resources/notifyCard.json";
import { ActivityHandler, TurnContext, MessageFactory, CardFactory } from 'botbuilder';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationBotFrameworkAuthenticationOptions
} from 'botbuilder';

// This bot's main dialog.
import { EchoBot } from './bot';

const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

server.use(restify.plugins.bodyParser({
    mapParams: true
}));

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(process.env as ConfigurationBotFrameworkAuthenticationOptions);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create the main dialog.
const conversationReferences = {};
const myBot = new EchoBot(conversationReferences);

// Listen for incoming requests.
server.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, async (context) => {
        console.log(context.activity);
        const response = await fetch('https://9qqlq809fb.execute-api.ap-south-1.amazonaws.com/dev/report-incident', {
        method: 'POST',
        body: JSON.stringify({
            "commit_id": {"S": `${context.activity?.value?.commitId}`},
            "Region": {"S": `${context.activity?.value?.region}`}
        }),
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        });

        if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
        }


        await myBot.run(context);
      });
      
});

// Listen for Upgrade requests for Streaming.
server.on('upgrade', async (req, socket, head) => {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);

    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;

    await streamingAdapter.process(req, socket as unknown as INodeSocket, head, (context) => myBot.run(context));
});

// Listen for incoming notifications and send proactive messages to users.
server.get('/api/notify', async (req, res) => {
    for (const conversationReference of Object.values(conversationReferences)) {
        await adapter.continueConversationAsync(process.env.MicrosoftAppId, conversationReference, async (context) => {
            await context.sendActivity('proactive hello');
        });
    }
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200); 
    res.write('<html><body><h1>Proactive messages have been sent. You used GET method</h1></body></html>');
    res.end();
});

// Listen for incoming custom notifications and send proactive messages to users.
server.post('/api/notify', async (req, res) => {

    const requestBody = JSON.stringify(req.body);
    console.log(requestBody);

    const fs = require('fs');
    const notifyCardJson = fs.readFileSync(path.join(__dirname, './resources/notifyCard.json'), 'utf-8');
    const notifyCardData = JSON.parse(notifyCardJson);
    notifyCardData.body[1].text = req.body.after;
    notifyCardData.actions[0].data.commitId = req.body.after;

    for (const conversationReference of Object.values(conversationReferences)) {
        await adapter.continueConversationAsync(process.env.MicrosoftAppId, conversationReference, async (context) => {
            const notifyCard = CardFactory.adaptiveCard(notifyCardData);
            const notifyMessage = MessageFactory.attachment(notifyCard);
            await context.sendActivity(notifyMessage);
        });
    }

    // const inputData = JSON.stringify(requestBody).inputData;
    // console.log(inputData);

    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write(JSON.stringify(requestBody));
    res.end();
});

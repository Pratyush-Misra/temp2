"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path = __importStar(require("path"));
const restify = __importStar(require("restify"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const botbuilder_1 = require("botbuilder");
// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const botbuilder_2 = require("botbuilder");
// This bot's main dialog.
const bot_1 = require("./bot");
const ENV_FILE = path.join(__dirname, '..', '.env');
dotenv_1.config({ path: ENV_FILE });
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
const botFrameworkAuthentication = new botbuilder_2.ConfigurationBotFrameworkAuthentication(process.env);
// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new botbuilder_2.CloudAdapter(botFrameworkAuthentication);
// Catch-all for errors.
const onTurnErrorHandler = (context, error) => __awaiter(void 0, void 0, void 0, function* () {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    // Send a trace activity, which will be displayed in Bot Framework Emulator
    yield context.sendTraceActivity('OnTurnError Trace', `${error}`, 'https://www.botframework.com/schemas/error', 'TurnError');
    // Send a message to the user
    yield context.sendActivity('The bot encountered an error or bug.');
    yield context.sendActivity('To continue to run this bot, please fix the bot source code.');
});
// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;
// Create the main dialog.
const conversationReferences = {};
const myBot = new bot_1.EchoBot(conversationReferences);
// Listen for incoming requests.
server.post('/api/messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield adapter.process(req, res, (context) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        console.log(context.activity);
        const response = yield node_fetch_1.default('https://9qqlq809fb.execute-api.ap-south-1.amazonaws.com/dev/report-incident', {
            method: 'POST',
            body: JSON.stringify({
                "commit_id": { "S": `${(_b = (_a = context.activity) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.commitId}` },
                "Region": { "S": `${(_d = (_c = context.activity) === null || _c === void 0 ? void 0 : _c.value) === null || _d === void 0 ? void 0 : _d.region}` }
            }),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }
        yield myBot.run(context);
    }));
}));
// Listen for Upgrade requests for Streaming.
server.on('upgrade', (req, socket, head) => __awaiter(void 0, void 0, void 0, function* () {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new botbuilder_2.CloudAdapter(botFrameworkAuthentication);
    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;
    yield streamingAdapter.process(req, socket, head, (context) => myBot.run(context));
}));
// Listen for incoming notifications and send proactive messages to users.
server.get('/api/notify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    for (const conversationReference of Object.values(conversationReferences)) {
        yield adapter.continueConversationAsync(process.env.MicrosoftAppId, conversationReference, (context) => __awaiter(void 0, void 0, void 0, function* () {
            yield context.sendActivity('proactive hello');
        }));
    }
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write('<html><body><h1>Proactive messages have been sent. You used GET method</h1></body></html>');
    res.end();
}));
// Listen for incoming custom notifications and send proactive messages to users.
server.post('/api/notify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requestBody = JSON.stringify(req.body);
    console.log(requestBody);
    const fs = require('fs');
    const notifyCardJson = fs.readFileSync(path.join(__dirname, './resources/notifyCard.json'), 'utf-8');
    const notifyCardData = JSON.parse(notifyCardJson);
    notifyCardData.body[1].text = req.body.after;
    notifyCardData.actions[0].data.commitId = req.body.after;
    for (const conversationReference of Object.values(conversationReferences)) {
        yield adapter.continueConversationAsync(process.env.MicrosoftAppId, conversationReference, (context) => __awaiter(void 0, void 0, void 0, function* () {
            const notifyCard = botbuilder_1.CardFactory.adaptiveCard(notifyCardData);
            const notifyMessage = botbuilder_1.MessageFactory.attachment(notifyCard);
            yield context.sendActivity(notifyMessage);
        }));
    }
    // const inputData = JSON.stringify(requestBody).inputData;
    // console.log(inputData);
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write(JSON.stringify(requestBody));
    res.end();
}));
//# sourceMappingURL=index.js.map
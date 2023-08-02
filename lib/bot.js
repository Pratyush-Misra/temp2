"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
exports.EchoBot = void 0;
const welcomeCard_json_1 = __importDefault(require("./resources/welcomeCard.json"));
const internsCard_json_1 = __importDefault(require("./resources/internsCard.json"));
const mentorsCard_json_1 = __importDefault(require("./resources/mentorsCard.json"));
const botbuilder_1 = require("botbuilder");
class EchoBot extends botbuilder_1.ActivityHandler {
    constructor(conversationReferences) {
        super();
        // Dependency injected dictionary for storing ConversationReference objects used in NotifyController to proactively message users
        this.conversationReferences1 = conversationReferences;
        this.onConversationUpdate((context, next) => __awaiter(this, void 0, void 0, function* () {
            addConversationReference(context.activity);
            yield next();
        }));
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage((context, next) => __awaiter(this, void 0, void 0, function* () {
            const userQuery = context.activity.text;
            let botResult = new String();
            if (userQuery == 'interns') {
                // botResult = 'Nishant Gautam Pratyush';
                const internsCard = botbuilder_1.CardFactory.adaptiveCard(internsCard_json_1.default);
                const internsMessage = botbuilder_1.MessageFactory.attachment(internsCard);
                yield context.sendActivity(internsMessage);
            }
            else if (userQuery == 'mentors') {
                const mentorsCard = botbuilder_1.CardFactory.adaptiveCard(mentorsCard_json_1.default);
                const mentorsMessage = botbuilder_1.MessageFactory.attachment(mentorsCard);
                yield context.sendActivity(mentorsMessage);
            }
            else {
                botResult = 'Enter a valid query like interns or mentors';
            }
            const replyText = `${botResult}`;
            console.log("################## REPLY TEXT STARTS #####################");
            console.log(replyText);
            console.log("################## REPLY TEXT ENDS #####################");
            yield context.sendActivity(botbuilder_1.MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            yield next();
        }));
        this.onMembersAdded((context, next) => __awaiter(this, void 0, void 0, function* () {
            const membersAdded = context.activity.membersAdded;
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    const welcomeCard = botbuilder_1.CardFactory.adaptiveCard(welcomeCard_json_1.default);
                    const welcomeMessage = botbuilder_1.MessageFactory.attachment(welcomeCard);
                    yield context.sendActivity(welcomeMessage);
                }
            }
            yield next();
        }));
        function addConversationReference(activity) {
            const conversationReference = botbuilder_1.TurnContext.getConversationReference(activity);
            conversationReferences[conversationReference.conversation.id] = conversationReference;
        }
    }
}
exports.EchoBot = EchoBot;
//# sourceMappingURL=bot.js.map
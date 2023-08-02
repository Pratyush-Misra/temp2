// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import WelcomeCard from "./resources/welcomeCard.json";
import InternsCard from "./resources/internsCard.json";
import MentorsCard from "./resources/mentorsCard.json";
import NotifyCard from "./resources/notifyCard.json";
import { ActivityHandler, TurnContext, MessageFactory, CardFactory } from 'botbuilder';

export class EchoBot extends ActivityHandler {
    public conversationReferences1: any;
    constructor(conversationReferences) {
        super();
        // Dependency injected dictionary for storing ConversationReference objects used in NotifyController to proactively message users
        this.conversationReferences1 = conversationReferences;

        this.onConversationUpdate(async (context, next) => {
            addConversationReference(context.activity);

            await next();
        });
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const userQuery = context.activity.text;
            let botResult = new String();
            if(userQuery == 'interns') {
                // botResult = 'Nishant Gautam Pratyush';
                const internsCard = CardFactory.adaptiveCard(InternsCard);
                const internsMessage = MessageFactory.attachment(internsCard);
                await context.sendActivity(internsMessage);
            }
            else if(userQuery == 'mentors') {
                const mentorsCard = CardFactory.adaptiveCard(MentorsCard);
                const mentorsMessage = MessageFactory.attachment(mentorsCard);
                await context.sendActivity(mentorsMessage);
            }
            else {
                botResult = 'Enter a valid query like interns or mentors'
            }
            const replyText = `${ botResult }`;
            console.log("################## REPLY TEXT STARTS #####################");
            console.log(replyText);
            console.log("################## REPLY TEXT ENDS #####################");
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;

            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);

                    const welcomeMessage = MessageFactory.attachment(welcomeCard);

                    await context.sendActivity(welcomeMessage);
                }
            }

            await next();
        });

        function addConversationReference(activity): void {
            const conversationReference = TurnContext.getConversationReference(activity);
            conversationReferences[conversationReference.conversation.id] = conversationReference;
        }
    }
}

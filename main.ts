import { CommandParam, commandList } from './src/commands';
import { Client, Message } from 'discord.js'
import * as db from './db.json';
import * as config from './config.json';

const bot = new Client();

// condensing bot.on functions being used
const botOnMessage = (callback) => bot.on('message', message => callback(message));
const botOnReady = (callback) => bot.on('ready', () => callback());

// on 'message'
botOnMessage((message: Message) => {
    // only parse messages that start with c?
    if (message.content.indexOf('c?') === 0) {
        message.channel.startTyping();
        // parse commandKey and commandValue
        const userMessage = message.content.substr('c?'.length);
        const commandKey = `${userMessage} `.split(' ')[0];
        const commandValue = userMessage.substr(commandKey.length).trim();
        console.log(`command: '${commandKey}', value: '${commandValue}'`);
        // if a valid command key was sent
        if (Object.keys(commandList).indexOf(commandKey) != -1) {
            const cp = <CommandParam> {
                message: message,
                commandKey: commandKey,
                commandValue: commandValue
            }
            // get response and send it back
            const resp = commandList[commandKey](cp)
            if (resp.then === undefined) {
                sendTheMessage(message, commandKey, resp);
            } else {
                resp.then(response => sendTheMessage(message, commandKey, response));
            }
        } else {
            // if an invalid command key was send
            message.channel.send(`${404} - command '${commandKey + commandValue}' is unknown`);
        }
        message.channel.stopTyping();
    }
});

// login and print 'ready' to console
bot.login(config.token);
botOnReady(() => {
    console.log('ready');
});

function sendTheMessage(message, commandKey, response) {
    if (commandKey === 'help') {
        message.channel.sendMessage(db.greeting, {files: [db.images.c3po]})
            .then(() => message.channel.send(response));
    } else {
        response = response === '' ? '.' : response;
        message.channel.send(response);
    }
}

import { CommandParam, commandList } from './src/commands';
import { Client, Message } from 'discord.js'
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
        const commandKey = `${`${userMessage} `.split(' ')[0]}\n`.split('\n')[0];
        const commandValue = userMessage.substr(commandKey.length).trim();
        console.log(`command: '${commandKey}', value: '${commandValue}'`);
        // if a valid command key was sent
        if (Object.keys(commandList).indexOf(commandKey) != -1) {
            // get response and send it back
            const resp = commandList[commandKey](<CommandParam> {
                message: message,
                commandKey: commandKey,
                commandValue: commandValue
            });
            if (resp.then === undefined) {
                sendTheMessage(message, resp);
            } else {
                resp.then(response => sendTheMessage(message, response)).catch(err => sendTheMessage(message, 'Error!' + err.toString()));
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

function sendTheMessage(message, response) {
    response = response === '' ? '.' : response;
    message.channel.send(response);
}

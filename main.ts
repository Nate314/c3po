import { CommandParam, commandList, Embed } from './src/commands';
import { Client, Message } from 'discord.js'
import { Browser } from './src/Utility';
import * as config from './config.json';

const bot = new Client();

// condensing bot.on functions being used
const botOnMessage = (callback) => bot.on('message', message => callback(message));
const botOnReady = (callback) => bot.on('ready', () => callback());

// on 'message'
botOnMessage((message: Message) => {
    // only parse messages that start with c?
    if (message.content.indexOf('c?') === 0) {
        const startTime = new Date().getTime();
        message.channel.startTyping();
        let resp = undefined;
        // parse commandKey and commandValue
        const userMessage = message.content.substr('c?'.length);
        const commandKey = `${`${userMessage} `.split(' ')[0]}\n`.split('\n')[0];
        const commandValue = userMessage.substr(commandKey.length).trim();
        console.log(`command: '${commandKey}', value: '${commandValue}'`);
        // if a valid command key was sent
        if (Object.keys(commandList).indexOf(commandKey) != -1) {
            // get response and send it back
            resp = commandList[commandKey](<CommandParam> {
                message: message,
                commandKey: commandKey,
                commandValue: commandValue
            });
        } else {
            // if an invalid command key was send
            resp = `${404} - command '${commandKey + commandValue}' is unknown`;
        }
        let promise = resp.then === undefined ? sendTheMessage(message, resp, startTime)
            : resp.then(response => sendTheMessage(message, response, startTime))
                  .catch(err => sendTheMessage(message, 'Error!' + err.toString(), startTime));
        promise.then(() => message.channel.stopTyping());
    }
});

// login and print 'ready' to console
bot.login(config.token);
botOnReady(() => {
    (async callback => {
        // https://github.com/puppeteer/puppeteer/issues/3443
        // https://www.youtube.com/watch?v=6LnJ1zW5464
        // npm i puppeteer
        // sudo apt install chromium-browser chromium-codecs-ffmpeg
        // npm install puppeteer-core@v1.11.0
        // const puppeteer = require('puppeteer-core');
        // const browser = await puppeteer.launch({executablePath: '/usr/bin/chromium-browser'});
        // sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
        const linux = process.platform !== 'win32';
        const puppeteer = require(`puppeteer${linux ? '-core' : ''}`);
        const options = {args: ['--no-sandbox'], dumpio: true};
        if (linux) {
            options['executablePath'] = '/usr/bin/chromium-browser';
        }
        Browser.browser = await puppeteer.launch(options);
        Browser.page = await Browser.browser.newPage();
        callback();
    })(() => {
        console.log('ready');
    });
});

function sendTheMessage(message: Message, response: Embed | string, startTime: number): Promise<any> {
    const now = new Date().getTime();
    return new Promise(resolve => {
        setTimeout(() => {
            response = response === '' ? '.' : response;
            return message.channel.send(response).then(() => resolve());
        }, Math.min(1000, 1000 - Math.abs(now - startTime)));
    });
}

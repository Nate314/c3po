import { CommandParam, commandList, Embed, updateMCServerStatusMessages, cacheMCServerStatusRequest } from './src/commands';
import { Client, Message } from 'discord.js'
import { Browser } from './src/Utility';
import * as config from './config.json';

const isDebugMode = true;
const authorizedDebugUsers = [
    'Nate314#3206',
    'c3po#1433',
];

const bot = new Client();

// condensing bot.on functions being used
const botOnMessage = callback => bot.on('message', message => callback(message));
const botOnReady = callback => bot.on('ready', () => {
    bot.user.setActivity(isDebugMode ? 'in development' : 'c?help', {
        type: 'PLAYING',
        url: 'https://github.com/nate314/c3po'
    });
    callback();

    updateMCServerStatusMessages();
    const now = new Date();
    const updateEveryMinutes = 5;
    const updateEverySeconds = updateEveryMinutes * 60;
    const secondsUntilNextTimeChunk = updateEverySeconds - (((now.getMinutes() * 60) + now.getSeconds()) % updateEverySeconds);
    console.log(`secondsUntilNextTimeChunk: ${secondsUntilNextTimeChunk}`);
    const alignmentInterval = setInterval(() => {
        const intervalNow = new Date();
        console.log('waiting for 0 seconds. Current time: ' + intervalNow.toLocaleTimeString());
        if (intervalNow.getMinutes() % updateEveryMinutes === 0 && intervalNow.getSeconds() === 0) {
            clearInterval(alignmentInterval);
            updateMCServerStatusMessages();
            setInterval(() => updateMCServerStatusMessages(), updateEverySeconds * 1000);
        }
    }, 1000);
});

// on 'message'
botOnMessage((message: Message) => {
    // only parse messages that start with c?
    if (message.content.indexOf('c?') === 0) {
        const startTime = new Date().getTime();
        if (isDebugMode) {
            if (!authorizedDebugUsers.includes(`${message.author.username}#${message.author.discriminator}`)) {
                sendTheMessage(message, `c3po is currently under development. Only ${JSON.stringify(authorizedDebugUsers)} can use c3po commands at this time.`, startTime);
                return;
            }
        }
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
                commandValue: commandValue,
            });
        } else {
            // if an invalid command key was send
            resp = `${404} - command '${commandKey + commandValue}' is unknown`;
        }
        let promise = resp.then === undefined ? sendTheMessage(message, resp, startTime)
            : resp.then(response => {
                const sentMessageCallback = (sentMessage: Message) => {
                    if (commandKey === 'mcserverstatus') {
                        if (!response.isError) {
                            cacheMCServerStatusRequest({
                                serverName: response.metadata.serverName,
                                serverAddress: response.metadata.serverAddress,
                                message: sentMessage,
                            });
                        }
                    }
                };
                sendTheMessage(message, commandKey === 'mcserverstatus' ? response.response : response, startTime, sentMessageCallback);
            }).catch(err => sendTheMessage(message, `Error! ${err.toString()}`, startTime));
        promise.then(() => message.channel.stopTyping());
    }
});

export const initializeBrowser = async () => {
    // https://github.com/puppeteer/puppeteer/issues/3443
    // https://www.youtube.com/watch?v=6LnJ1zW5464
    // npm i puppeteer
    // sudo apt install chromium-browser chromium-codecs-ffmpeg
    // npm install puppeteer-core@v1.11.0
    // const puppeteer = require('puppeteer-core');
    // const browser = await puppeteer.launch({executablePath: '/usr/bin/chromium-browser'});
    // sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
    const isLinux = process.platform !== 'win32';
    const puppeteer = require(isLinux ? 'puppeteer-core' : 'puppeteer');
    const options = {args: ['--no-sandbox'], dumpio: true};
    if (isLinux) {
        options['executablePath'] = '/usr/bin/chromium-browser';
    }
    Browser.browser = await puppeteer.launch(options);
    Browser.page = await Browser.browser.newPage();
};

// login and print 'ready' to console
bot.login(config.token);
botOnReady(() => {
    (async callback => {
        initializeBrowser();
        callback();
    })(() => {
        console.log('ready');
    });
});

function sendTheMessage(message: Message, response: Embed | string, startTime: number, callback: (sentMessage: Message) => void = undefined): Promise<any> {
    const now = new Date().getTime();
    return new Promise(resolve => {
        setTimeout(() => {
            response = response === '' ? '.' : response;
            return message.channel.send(response).then(sentMessage => resolve(callback ? callback(sentMessage as Message) : undefined));
        }, Math.min(1000, 1000 - Math.abs(now - startTime)));
    });
}

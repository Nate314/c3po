import { CommandParam, commandList, Embed, updateMCServerStatusMessages, cacheMCServerStatusRequest, SendableMessage } from './src/commands';
import { ActivityType, Client, GatewayIntentBits, Message, Partials } from 'discord.js'
import puppeteer from 'puppeteer';
import { Browser, logFailure } from './src/Utility';

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKEN is not set. Copy .env.example to .env and put the bot token there.');
    process.exit(1);
}

const isDebugMode = true;
const authorizedDebugUsers = [
    'Nate314#3206',
    'c3po#1433',
];

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel], // needed to receive DMs
});

// condensing bot.on functions being used
const botOnMessage = callback => bot.on('messageCreate', message => message.channel.isSendable() && callback(message));
const botOnReady = callback => bot.on('clientReady', () => {
    bot.user.setActivity(isDebugMode ? 'in development' : 'c?help', {
        type: ActivityType.Playing,
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
botOnMessage((message: SendableMessage) => {
    // only parse messages that start with c?
    if (message.content.indexOf('c?') === 0) {
        const startTime = new Date().getTime();
        if (isDebugMode) {
            if (!authorizedDebugUsers.includes(`${message.author.username}#${message.author.discriminator}`)) {
                sendTheMessage(message, `c3po is currently under development. Only ${JSON.stringify(authorizedDebugUsers)} can use c3po commands at this time.`, startTime);
                return;
            }
        }
        message.channel.sendTyping().catch(logFailure('sendTyping'));
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
        resp.then === undefined ? sendTheMessage(message, resp, startTime)
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
    }
});

export const initializeBrowser = async () => {
    // The Docker image sets PUPPETEER_EXECUTABLE_PATH to its Chromium, which puppeteer reads itself.
    const options = {args: ['--no-sandbox'], dumpio: true};
    Browser.browser = await puppeteer.launch(options);
    Browser.page = await Browser.browser.newPage();
};

// login and print 'ready' to console
bot.login(token);
botOnReady(() => {
    (async callback => {
        initializeBrowser().catch(logFailure('initializeBrowser'));
        callback();
    })(() => {
        console.log('ready');
    });
});

function sendTheMessage(message: SendableMessage, response: Embed | string, startTime: number, callback: (sentMessage: Message) => void = undefined): Promise<any> {
    const now = new Date().getTime();
    return new Promise(resolve => {
        setTimeout(() => {
            response = response === '' ? '.' : response;
            return message.channel.send(response).then(sentMessage => resolve(callback ? callback(sentMessage as Message) : undefined))
                .catch(err => { logFailure('send reply')(err); resolve(undefined); });
        }, Math.min(1000, 1000 - Math.abs(now - startTime)));
    });
}

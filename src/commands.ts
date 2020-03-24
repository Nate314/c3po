import * as db from '../db.json';
import { RichEmbed, Message } from 'discord.js';
import { Say2 } from './Say2';
import { TicTacToe } from './TicTacToe';
import { HttpClient } from './httpclient';
import { executeCode } from './CodeRunner';
import { makeEmbed } from './Utility';

export class Embed {
    embed: RichEmbed;
}

export class CommandParam {
    message: Message;
    commandKey: string;
    commandValue: string;
}

export class Commands {

    public static help(cp: CommandParam): Promise<Embed> {
        let commands = [
            'c?help => (get list of commands)',
            'c?servertime => (returns the datetime of the server)',
            'c?echo <message> => (sends back <message>)',
            'c?multiply <x> <message> => (sends back <message> <x> number of times)',
            'c?say2 <number> => (sends back <number> in english text)',
            'c?tictactoe => (start a game of tic tac toe)',
            'c?ph <number> => (return <number> r/programmerhumor memes)',
            'c?pup <width> <height> <link> => (returns an image of the link sent at (<width>, <height>) resolution)',
            'c?js <javascript code> => executes javascript code like "(() => 4 + 5);" and returns result',
            'c?py <javascript code> => executes javascript code like "def main(): return 4 + 5" and returns result',
            'c?mixcase <message> => (returns the <message> in MiXeD CaSe)'
        ];
        
        return cp.message.channel.send(db.greeting, {files: [db.images.c3po]})
            .then(() => makeEmbed('c3po Commands Include:', commands.join('\n')));
    }

    public static servertime(cp: CommandParam): Embed {
        return makeEmbed('Server Time', new Date().toLocaleString());
    }

    public static echo(cp: CommandParam): string {
        return cp.commandValue;
    }

    public static multiply(cp: CommandParam): string {
        const first = `${cp.commandValue} `.split(' ')[0];
        const quantity = Number(first);
        const str = cp.commandValue.substr(first.length);
        if (!isNaN(quantity)) {
            let result = '';
            for (let i = 0; i < quantity; i++) result += str;
            if (result.length <= 2000) return result;
            else return 'result is more than 2000 characters';
        } else return 'could not parse quantity';
    }

    public static say2(cp: CommandParam) {
        if (isNaN(Number(cp.commandValue))) return 'NaN';
        else return Say2.compute(cp.commandValue);
    }

    public static async tictactoe(cp: CommandParam): Promise<Embed | string> {
        return TicTacToe.compute(cp).then(resp => {
            if (resp['title'] !== undefined) {
                return makeEmbed(resp);
            } else {
                return <string> resp;
            }
        });
    }

    public static async puppeteer(cp: CommandParam): Promise<Embed | string> {
        // https://github.com/puppeteer/puppeteer/issues/3443
        // npm i puppeteer
        // sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
        const linux = process.platform !== 'win32';
        const fs = require('fs');
        const puppeteer = require(`puppeteer${linux ? '-core' : ''}`);
        const options = {args: ['--no-sandbox'], dumpio: true};
        if (linux) {
            options['executablePath'] = '/usr/bin/chromium-browser';
        }
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        const w = Number(`${cp.commandValue}  `.split(' ')[0]), h = Number(`${cp.commandValue}  `.split(' ')[1]);
        const url = `${cp.commandValue}  `.split(' ')[2];
        await page.setViewport({ width: w, height: h });
        await page.goto(url);
        setTimeout(async () => {
            const filename = `puppeteer-${new Date().getTime()}.png`;
            await page.screenshot({path: filename, type: 'png'});
            await browser.close();
            cp.message.channel.send(makeEmbed(url, undefined, undefined, filename)).then(() => {
                fs.unlink(filename, function (err) {
                    if (err) throw err;
                }); 
            });
        }, 1000);
        return '';
    }

    public static async reddit(cp: CommandParam) {
        console.log(cp);
        const commandValueParts = `${cp.commandValue} `.split(' ');
        console.log(commandValueParts);
        const subreddit = commandValueParts[0];
        const commandValue = commandValueParts[1];
        return Commands.redditImages(subreddit, <CommandParam> {
            commandKey: cp.commandKey,
            commandValue: commandValue,
            message: cp.message
        });
    }

    public static async programmerhumor(cp: CommandParam) {
        return Commands.redditImages('programmerhumor', cp);
    }

    public static async redditImages(subreddit: string, cp: CommandParam): Promise<Embed | string> {
        const queryURL = `https://www.reddit.com/r/${subreddit}/top/.json?count=100`;
        return HttpClient.get(queryURL).then(body => {
            const responsebody = JSON.parse(body);
            if (cp.commandValue && !isNaN(Number(cp.commandValue))) {
                let response = '';
                for (let i = 0; i < Number(cp.commandValue); i++) {
                    const element = responsebody['data']['children'][i];
                    if (element) {
                        const { title, url } = element['data'];
                        cp.message.channel.send(makeEmbed(title, undefined, url));
                    }
                }
                return response;
            } else {
                let index = 0;
                for (let i = 0; i < 100; i++) {
                    const element = responsebody['data']['children'][index];
                    if (element) {
                        const { title, url } = element['data'];
                        cp.message.channel.send(makeEmbed(title, undefined, url));
                        break;
                    } else {
                        index++;
                    }
                }
                return '';
            }
        });
    }

    public static async executeJS(cp: CommandParam): Promise<Embed | string> {
        const queryURL = 'https://test--nate314.repl.co/js';
        return executeCode(cp, queryURL, cp.commandValue, ['js', 'javascript', 'java']);
    }

    public static async executePython(cp: CommandParam): Promise<Embed | string> {
        const queryURL = 'https://Python-Test--nate314.repl.co/py';
        return executeCode(cp, queryURL, cp.commandValue, ['py', 'python', 'python3']);
    }

    public static async mixCase(cp: CommandParam): Promise<Embed | string> {
        return cp.commandValue.split('').map((v, i) => v[i % 2 === 0 ? 'toLowerCase' : 'toUpperCase']()).join('');
    }
}

// List of commands
export const commandList = {
    'help': Commands.help,
    'servertime': Commands.servertime,
    'echo': Commands.echo,
    'multiply': Commands.multiply,
    'say2': Commands.say2,
    'tictactoe': Commands.tictactoe,
    'reddit': Commands.reddit,
    'ph': Commands.programmerhumor,
    'pup': Commands.puppeteer,
    'js': Commands.executeJS,
    'py': Commands.executePython,
    'mixcase': Commands.mixCase
};

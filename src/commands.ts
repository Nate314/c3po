import * as db from '../db.json';
import { RichEmbed, Message } from 'discord.js';
import { Say2 } from './Say2';
import { TicTacToe } from './TicTacToe';
import { HttpClient } from './httpclient';
import { executeCode } from './CodeRunner';
import { makeEmbed, Browser } from './Utility';

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
        return TicTacToe.compute(cp).then(async resp => {
            if (typeof resp === 'object') {
                const embed = (<Embed> resp).embed;
                const board = embed.footer.text.split(',')[4].split('').join('.');
                const url = `https://simplegamerenders.nathangawith.com/tictactoe/?colors=green.blue.red&board=${board}`;
                const filename = await Commands.puppeteer(546, 546, url);
                console.log(embed.title);
                console.log(filename);
                console.log(embed.footer.text);
                const richEmbed = makeEmbed(embed.title, undefined, undefined, filename, embed.footer.text);
                console.log(richEmbed);
                return richEmbed;
            } else {
                return <string> resp;
            }
        });
    }

    public static async puppeteer(w: number, h: number, url: string): Promise<string> {
        const fs = require('fs');
        await Browser.page.setViewport({ width: w, height: h });
        await Browser.page.goto(url);
        return new Promise(resolve => {
            setTimeout(async () => {
                const filename = `puppeteer-${new Date().getTime()}.png`;
                await Browser.page.screenshot({path: filename, type: 'png'});
                // await Browser.browser.close();
                setTimeout(() => {
                    fs.unlink(filename, function (err) {
                        if (err) throw err;
                    });
                }, 2000);
                resolve(filename);
            }, 0);
        });
    }

    public static async pup(cp: CommandParam): Promise<Embed | string> {
        const commandParts = `${cp.commandValue}  `.split(' ');
        const width = Number(commandParts[0]) || 128;
        const height = Number(commandParts[1]) || 128;
        const url = commandParts[2] || commandParts[0];
        return Commands.puppeteer(width, height, url)
            .then(filename => makeEmbed(url, undefined, undefined, filename));
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
    'pup': Commands.pup,
    'js': Commands.executeJS,
    'py': Commands.executePython,
    'mixcase': Commands.mixCase
};

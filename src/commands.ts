import { RichEmbed, Message } from 'discord.js';
import { makeEmbed, Browser } from './Utility';
import { TicTacToe } from './games/TicTacToe';
import { initializeBrowser } from '../main';
import { executeCode } from './CodeRunner';
import { Fifteen } from './games/Fifteen';
import { Mancala } from './games/Mancala';
import { HttpClient } from './httpclient';
import * as db from '../db.json';
import { Say2 } from './Say2';

const simplegamerendersUrl = 'https://simplegamerenders.nathangawith.com';

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
            '\n\nGENERAL COMMANDS\n--------------------------------',
            '\nc?help', ' => get list of commands',
            '\nc?servertime', ' => returns the datetime of the server',
            '\n\nGAME COMMANDS\n--------------------------------',
            '\nc?tictactoe', ' => start a game of tic tac toe',
            '\nc?fifteen <size>', ' => start a game of fifteen with size of <size> (valid sizes are 3, 8, 15)',
            '\nc?mancala', ' => start a game of mancala',
            '\n\nINTERNET COMMANDS\n--------------------------------',
            '\nc?reddit <subreddit> <number>', ' => return <number> r/<subreddit> memes',
            '\nc?ph <number>', ' => return <number> r/programmerhumor memes',
            '\nc?pup <width> <height> <link>', ' => returns an image of the link sent at (<width>, <height>) resolution',
            '\nc?js <javascript code>', ' => xecutes javascript code like "(() => 4 + 5);" and returns result',
            '\nc?py <javascript code>', ' => xecutes javascript code like "def main(): return 4 + 5" and returns result',
            '\n\nTEXT MANIPULATION COMMANDS\n--------------------------------',
            '\nc?echo <message>', ' => sends back <message>',
            '\nc?multiply <x> <message>', ' => sends back <message> <x> number of times',
            '\nc?say2 <number>', ' => sends back <number> in english text',
            '\nc?mixcase <message>', ' => returns the <message> in MiXeD CaSe',
            '\nc?mixcaserand <message>', ' => returns the <message> in RAndoM mixEd CASe'
        ];
        return cp.message.channel.send(db.greeting, {files: [db.images.c3po]})
            .then(() => makeEmbed('c3po Commands Include:', '```\n' + commands.join('\n') + '\n```'));
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

    public static async renderGame(gameFunc: any, cp: CommandParam, path: string, colors: string, joinString: string): Promise<Embed | string> {
        return (<Promise<Embed | string>> gameFunc(cp)).then(async resp => {
            if (typeof resp === 'object') {
                const embed = (<Embed> resp).embed;
                const board = embed.footer.text.split(',')[4].split('').join(joinString);
                const url = `${simplegamerendersUrl}/${path}/?colors=${colors}&board=${board}`;
                const filename = await Commands.puppeteer((path === 'mancala' ? 2 : 1) * 546, 546, url);
                const richEmbed = makeEmbed(embed.title, undefined, undefined, filename, embed.footer.text);
                return richEmbed;
            } else {
                return <string> resp;
            }
        });
    }

    public static async tictactoe(cp: CommandParam): Promise<Embed | string> {
        return Commands.renderGame(TicTacToe, cp, 'tictactoe', 'green.blue.red', '.');
    }

    public static async fifteen(cp: CommandParam): Promise<Embed | string> {
        return Commands.renderGame(Fifteen, cp, 'fifteen', 'red.green', '');
    }

    public static async mancala(cp: CommandParam): Promise<Embed | string> {
        return Commands.renderGame(Mancala, cp, 'mancala', 'magenta.blue', '');
    }

    public static async puppeteer(w: number, h: number, url: string, timeout: number = 0): Promise<string> {
        const fs = require('fs');
        await Browser.page.setViewport({ width: w, height: h });
        await Browser.page.goto(url);
        return new Promise(resolve => {
            setTimeout(async () => {
                const filename = `puppeteer-${new Date().getTime()}.png`;
                await Browser.page.screenshot({path: filename, type: 'png'});
                await initializeBrowser();
                setTimeout(() => {
                    fs.unlink(filename, function (err) {
                        if (err) throw err;
                    });
                }, 2000);
                resolve(filename);
            }, timeout);
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

    public static async mcserverstatus(cp: CommandParam): Promise<{isError: boolean, response: Embed | string, metadata?: { serverName: string, serverAddress: string }}> {
        if (cp.commandValue?.split(' ')?.length == 2) {
            const [ serverName, serverAddress ] = cp.commandValue?.split(' ');
            const requestUrl = `${simplegamerendersUrl}/mcserverstatus/index.html?servername=${serverName}&serveraddress=${serverAddress}&date=${new Date().getTime()}`;
            console.log(requestUrl);
            const filename = await Commands.puppeteer(768, 400, requestUrl, 5000);
            const embedTitle = `${serverName} Status (Last updated ${new Date().toLocaleString()})`;
            const richEmbed = makeEmbed(embedTitle, undefined, undefined, filename, undefined);
            if (`${cp.message.author.username}#${cp.message.author.discriminator}` === 'c3po#1433') {
                cp.message.edit(richEmbed);
                return undefined;
            }
            return {
                isError: false,
                response: richEmbed,
                metadata: {
                    serverName,
                    serverAddress,
                },
            };
        } else {
            return {
                isError: true,
                response: 'Could not parse message. Please send in the form: \'c?mcserverstatus ExampleServerName example.server.address\'',
            };
        }
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

    public static async mixCaseRand(cp: CommandParam): Promise<Embed | string> {
        const str = cp.commandValue;
        const lower = str.toLowerCase();
        const upper = str.toUpperCase();
        return Array(str.length).fill(null).map((_, i) => (Math.random() < 0.5 ? lower : upper)[i]).join('');
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
    'fifteen': Commands.fifteen,
    'mancala': Commands.mancala,
    'reddit': Commands.reddit,
    'ph': Commands.programmerhumor,
    'mcserverstatus': Commands.mcserverstatus,
    'pup': Commands.pup,
    'js': Commands.executeJS,
    'py': Commands.executePython,
    'mixcase': Commands.mixCase,
    'mixcaserand': Commands.mixCaseRand
};

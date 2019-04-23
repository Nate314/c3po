import { RichEmbed, Message } from 'discord.js';
import { Say2 } from './Say2';
import { TicTacToe } from './TicTacToe';
import { HttpClient } from './httpclient';

class Embed {
    embed: RichEmbed;
}

export class CommandParam {
    message: Message;
    commandKey: string;
    commandValue: string;
}

export class Commands {

    public static help(cp: CommandParam): Embed {
        let commands = [
            'c?help =>(get list of commands)',
            'c?servertime =>(returns the datetime of the server)',
            'c?echo <message> =>(sends back <message>)',
            'c?multiply <x> <message> =>(sends back <message> <x> number of times)',
            'c?say2 <number> =>(sends back <number> in english text)',
            'c?tictactoe =>(start a game of tic tac toe)'
        ];
        return <Embed> {
                embed: <RichEmbed> {
                    color: 3447003,
                    title: 'c3po Commands Include:',
                    description: commands.join('\n')
                }
            };
    }

    public static servertime(cp: CommandParam): Embed {
        return <Embed> {
                embed: <RichEmbed> {
                    color: 3447003,
                    title: 'Server Time',
                    description: new Date().toLocaleString()
            }
        };
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
            console.log(resp['title'] !== undefined);
            console.log(resp);
            if (resp['title'] !== undefined) {
                return <Embed> {
                    embed: resp
                }
            } else {
                return <string> resp;
            }
        });
    }

    public static async puppeteer(cp: CommandParam): Promise<Embed | string> {
        const puppeteer = require('puppeteer');
        const filename = `./bigboy-${new Date().getTime()}.png`;
        return (async () => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setViewport({
                width:          Number(`${cp.commandValue}  `.split(' ')[0]),
                height:         Number(`${cp.commandValue}  `.split(' ')[1]),
            });
            console.log(cp.commandValue);
            await page.goto(`${cp.commandValue}  `.split(' ')[2]);
            setTimeout(_ => _, 1000);
            await page.screenshot({path: filename});
            await browser.close();
            
            cp.message.channel.send(<Embed> {
                embed: <RichEmbed> {
                    color: 3447003,
                    title: 'cp.commandValue',
                    files: [
                        filename
                    ]
                }
            });
            return 'hey';
        })();
    }

    public static async redditProgrammingHumor(cp: CommandParam): Promise<Embed | string> {
        const queryURL = 'https://www.reddit.com/r/programminghumor/top/.json?count=100';
        return HttpClient.get(queryURL).then(body => {
            if (cp.commandValue && !isNaN(Number(cp.commandValue))) {
                let response = '';
                for (let i = 0; i < Number(cp.commandValue); i++) {
                    const element = JSON.parse(body)['data']['children'][i];
                    if (element) {
                        const { title, url } = element['data'];
                        cp.message.channel.send(<Embed> {
                            embed: <RichEmbed> {
                                color: 3447003,
                                title: title,
                                image: {
                                    url: url
                                }
                            }
                        });
                    }
                }
                return response;
            } else {
                let index = 0;
                for (let i = 0; i < 100; i++) {
                    const element = JSON.parse(body)['data']['children'][index];
                    if (element) {
                        const { title, url } = element['data'];
                        cp.message.channel.send(<Embed> {
                            embed: <RichEmbed> {
                                color: 3447003,
                                title: title,
                                image: {
                                    url: url
                                }
                            }
                        });
                        break;
                    } else {
                        index++;
                    }
                }
                return '';
            }
        });
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
    'ph': Commands.redditProgrammingHumor,
    'pup': Commands.puppeteer
};

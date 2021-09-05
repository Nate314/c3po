import { User } from "discord.js";
import { CommandParam, Embed } from "../commands";
import { makeEmbed } from "../Utility";

// generic 2 player game class
export class AbstractGame {

    private cmd: string;
    private gameTitle: string;
    private initialBoard: string;
    private isValidMove: (board: string, position: string, xORo: string) => boolean;
    private playTurn: (board: string, position: number | string, xORo: string) => { newBoard: string, nextPlayer: string };
    private checkForWin: (board: string) => string;
    private renderBoard: (board: string) => string;
    private multiPlayer: boolean;

    /**
     * @param cmd command used to interact with the game
     * @param gameTitle title to display for the game
     * @param isValidMove function used to check if requested move is valid
     * @param playTurn function used to calculate the next board
     * @param checkForWin function used to check if a player has won
     * @param renderBoard function used to render the game board
     */
    constructor(cmd: string,
        gameTitle: string,
        initialBoard: string,
        players: number,
        isValidMove: (board: string, position: string, xORo: string) => boolean,
        playTurn: (board: string, position: number | string, xORo: string) => { newBoard: string, nextPlayer: string },
        checkForWin: (board: string) => string,
        renderBoard: (board: string) => string
    ) {
            this.cmd = cmd;
            this.gameTitle = gameTitle;
            this.initialBoard = initialBoard;
            this.isValidMove = isValidMove;
            this.playTurn = playTurn;
            this.renderBoard = renderBoard;
            this.checkForWin = checkForWin;
            this.multiPlayer = players !== 1;
    }

    private getSender(cp: CommandParam) {
        return `${cp.message.author.username}#${cp.message.author.discriminator}`;
    }

    // run this function to get back a result for the given CommandParam
    public async compute(cp: CommandParam): Promise<Embed | string> {
        const sender = this.getSender(cp);
        switch (`${cp.commandValue} `.split(' ')[0]) {
            case 'start':
                const board = this.initialBoard;
                const player1 = sender;
                const mention: User = cp.message.mentions.users.first();
                const player2 = mention ? `${mention.username}#${mention.discriminator}` : undefined;
                const title = `${this.gameTitle} (${sender}'s turn) . . . .`;
                const footer = `${player1},x,${this.multiPlayer ? player2 : player1},o,${board}`;
                return !this.multiPlayer || player2
                    ? makeEmbed(title, this.renderBoard(board), undefined, undefined, footer)
                    : `Please mention another user on this discord server ex: "c?${this.cmd} start @c3po#1433"`;
            case 'turn':
                const position = cp.commandValue.split(' ')[1];
                const tileSequence = cp.commandValue.substr('turn '.length).split(' ').map(x => Number(x));
                const isMultiTurn = !this.multiPlayer && !tileSequence.map(x => !isNaN(x)).includes(false) && tileSequence.length > 1;
                return isMultiTurn ? this.computeTurns(cp, tileSequence)
                    : (!isNaN(Number(position)) ? await this.turn(cp, sender, position)
                        : `position ${position} is not available`);
            default:
                return `Could not parse . . . please send 'c?${this.cmd} start ${this.multiPlayer ? '<username>' : '<size>'}' or 'c?${this.cmd} turn <position>'`;
        }
    }

    // calculates a series of turns
    public async computeTurns(cp: CommandParam, positions: number[]): Promise<Embed | string> {
        const getBoard = (result: Embed | string) => {
            if (typeof result === 'object') {
                const richEmbed = (<Embed> result).embed;
                return (richEmbed.title.includes('won')) ? undefined : richEmbed.footer.text.split(',')[4];
            } else return undefined;
        }
        const tempCP = <CommandParam> { commandKey: this.cmd, commandValue: cp.commandValue.split(' ').splice(0, 2).join(' '), message: cp.message };
        let result = await this.compute(tempCP);
        const sender = this.getSender(cp);
        for (let p of positions.splice(1)) {
            const board = getBoard(result);
            if (!!board) result = await this.turn(null, sender, p.toString(), board);
            else break;
        }
        return result;
    }

    // calculates a turn
    private async turn(cp: CommandParam, sender: string, position: string, theBoard?: string): Promise<Embed | string> {
        if (!!theBoard && !this.multiPlayer) {
            return this.move('x', sender, sender, position, theBoard)
        } else {
            if (sender && position) return await cp.message.channel.fetchMessages({ limit: 20 })
                .then(messages => {
                    const mappedMessages = messages.keyArray().map(k => ({key: k, author: messages.get(k).author.username, content: messages.get(k).content, embed: messages.get(k).embeds[0]}));
                    // search for last message
                    for (let mappedMessage of mappedMessages) {
                        console.log(mappedMessage.key);
                        // that was sent by c3po
                        if (mappedMessage.author === 'c3po') {
                            const embed = mappedMessage.embed;
                            // and contains an embed with {gameTitle} in the title
                            if (embed && embed.title && (embed.title.indexOf(this.gameTitle) !== -1)) {
                                if (embed.title.indexOf('won') !== -1) {
                                    return `${embed.title} . . . run the command 'c?${this.cmd} start${this.multiPlayer ? ' <username>' : ''}' to start a new game`;
                                }
                                // and is a game with the sending user
                                else if (embed.footer.text && embed.footer.text.indexOf(sender) !== -1) {
                                    const footer = embed.footer.text;
                                    const title = embed.title;
                                    let otherplayer;
                                    if (title.indexOf(sender) === -1) {
                                        // if it is not the sending user's turn
                                        otherplayer = footer.split(',')[0];
                                        return `It is not your turn, it is ${otherplayer}'s turn.`;
                                    } else {
                                        // if it is the sending user's turn
                                        const xORo = footer.substr(footer.indexOf(sender) + sender.length + 1, 1);
                                        otherplayer = footer.split(',')[2];
                                        // decode the board
                                        const board = theBoard || footer.split(',')[4];
                                        const r = this.move(xORo, sender, otherplayer, position, board);
                                        if (r) return r;
                                    }
                                }
                            }
                        }
                    }
                    return 'Could not find game in the past 20 messages';
                })
                .catch(e => {
                    return JSON.stringify(e); //'Error retrieving messages';
                });
            else return 'Error retrieving sender or position';
        }
    }

    // calculates a move
    private async move(xORo: string, sender: string, otherplayer: string, position: string, board: string) {
        // make sure the position requested is available
        if (this.isValidMove(board, position, xORo)) {
            if (otherplayer && sender && board) {
                const { newBoard, nextPlayer } = this.playTurn(board, position, xORo);
                let title = `${this.gameTitle} (${nextPlayer === xORo ? sender : otherplayer}'s turn) . . . .`;
                if (newBoard) {
                    let winner = this.checkForWin(newBoard);
                    if (winner !== '') {
                        if (winner === xORo) winner = sender;
                        else if (winner === 'xo') title = `${this.gameTitle} ended in a TIE . . .`;
                        else winner = otherplayer;
                        // if the game didn't end in a tie
                        if (winner === sender || winner === otherplayer) title = `${winner} won ${this.gameTitle} . . .`;
                    }
                    // send back new board
                    let newFooter;
                    if (xORo === nextPlayer) {
                        newFooter = `${this.multiPlayer ? sender : otherplayer},${xORo},${otherplayer},${xORo === 'x' ? 'o' : 'x'},${newBoard}`;
                    } else {
                        newFooter = `${this.multiPlayer ? otherplayer : sender},${xORo === 'x' ? 'o' : 'x'},${sender},${xORo},${newBoard}`;
                    }
                    const renderedBoard = this.renderBoard(newBoard);
                    return makeEmbed(title, renderedBoard, undefined, undefined, newFooter);
                } else return 'Invalid move';
            }
        } else return `position ${position} is not available`;
    }
}

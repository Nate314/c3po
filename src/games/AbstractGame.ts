import { User } from "discord.js";
import { CommandParam, Embed } from "../commands";
import { makeEmbed } from "../Utility";

// generic 2 player game class
export class AbstractGame {

    private cmd: string;
    private gameTitle: string;
    private initialBoard: string;
    private playTurn: any;
    private checkForWin: any;
    private renderBoard: any;

    /**
     * @param cmd command used to interact with the game
     * @param gameTitle title to display for the game
     * @param playTurn function used to calculate the next board
     * @param checkForWin function used to check if a player has won
     * @param renderBoard function used to render the game board
     */
    constructor(cmd: string, gameTitle: string, initialBoard: string,
        playTurn: any, checkForWin: any, renderBoard: any) {
            this.cmd = cmd;
            this.gameTitle = gameTitle;
            this.initialBoard = initialBoard;
            this.playTurn = playTurn;
            this.renderBoard = renderBoard;
            this.checkForWin = checkForWin;
    }

    // run this function to get back a result for the given CommandParam
    public async compute(cp: CommandParam): Promise<Embed | string> {
        const sender = `${cp.message.author.username}#${cp.message.author.discriminator}`;
        switch (`${cp.commandValue} `.split(' ')[0]) {
            case 'start':
                const board = this.initialBoard;
                const player1 = sender;
                const mention: User = cp.message.mentions.users.first();
                const player2 = mention ? `${mention.username}#${mention.discriminator}` : undefined;
                const title = `${this.gameTitle} (${sender}'s turn) . . . .`;
                const footer = `${player1},x,${player2},o,${board}`;
                return player2
                    ? makeEmbed(title, this.renderBoard(board), undefined, undefined, footer)
                    : `Please mention another user on this discord server ex: "c?${this.cmd} start @c3po#1433"`;
            case 'turn':
                const position = cp.commandValue.split(' ')[1];
                return !isNaN(Number(position))
                    ? await this.turn(cp, sender, position)
                    : `position ${position} is not available`;
            default:
                return `Could not parse . . . please send 'c?${this.cmd} start <username>' or c?${this.cmd} turn <position>'`;
        }
    }

    // calculates a turn
    private async turn(cp: CommandParam, sender: string, position: string): Promise<Embed | string> {
        let result = '';
        if (sender && position) return await cp.message.channel.fetchMessages({ limit: 20 })
            .then(messages => {
                // search for last message
                for (let key of messages.keyArray()) {
                    // that was sent by c3po
                    if (messages.get(key).member.user.username === 'c3po') {
                        const embed = messages.get(key).embeds.pop();
                        // and contains an embed with {gameTitle} in the title
                        if (embed && embed.title && (embed.title.indexOf(this.gameTitle) !== -1)) {
                            if (embed.title.indexOf('won') !== -1) {
                                return `${embed.title} . . . run the command 'c?tictactoe start <username>' to start a new game`;
                            }
                            // and is a game with the sending user
                            else if (embed.footer.text && embed.footer.text.indexOf(sender) !== -1) {
                                const footer = embed.footer.text;
                                const title = embed.title;
                                let otherplayer;
                                if (title.indexOf(sender) === -1) {
                                    // if it is not the sending user's turn
                                    otherplayer = footer.split(',')[0];
                                    result = `It is not your turn, it is ${otherplayer}'s turn.`;
                                    return result;
                                } else {
                                    // if it is the sending user's turn
                                    const xORo = footer.substr(footer.indexOf(sender) + sender.length + 1, 1);
                                    otherplayer = footer.split(',')[2];
                                    // decode the board
                                    const board = footer.split(',')[4];
                                    // make sure the position requested is available
                                    if (board.indexOf(position) !== -1) {
                                        if (otherplayer && sender && board) {
                                            let title = `${this.gameTitle} (${otherplayer}'s turn) . . . .`;
                                            const newBoard = this.playTurn(board, position, xORo);
                                            let winner = this.checkForWin(newBoard);
                                            if (winner !== '') {
                                                if (winner === xORo) winner = sender;
                                                else if (winner === 'xo') title = `${this.gameTitle} ended in a TIE . . .`;
                                                else winner = otherplayer;
                                                // if the game didn't end in a tie
                                                if (winner === sender || winner === otherplayer) title = `${winner} won ${this.gameTitle} . . .`;
                                            }
                                            // send back new board
                                            const newFooter = `${otherplayer},${xORo === 'x' ? 'o' : 'x'},${sender},${xORo},${newBoard}`;
                                            const renderedBoard = this.renderBoard(newBoard);
                                            return makeEmbed(title, renderedBoard, undefined, undefined, newFooter);
                                        };
                                    } else return `position ${position} is not available`;
                                }
                            }
                        }
                    }
                }
                result = 'Could not find game in the past 20 messages';
                return result;
            })
            .catch(() => {
                result = 'Error retrieving messages';
                return result;
            });
        else return 'Error retrieving sender or position';
    }
}

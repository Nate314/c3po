import { RichEmbed } from "discord.js";
import { CommandParam } from "./commands";

export class TicTacToe {

    public static async compute(cp: CommandParam): Promise<RichEmbed | string> {
        const dummystring = '123456789987654321123456789987654321!@#$%^&*()_+'
        const command = `${cp.commandValue} `.split(' ')[0];
        const sender = cp.message.author.username;
        let board;
        let player1;
        let player2;
        switch (command) {
            case 'start':
                board = '123456789';
                player1 = sender;
                player2 = `${cp.commandValue} ${dummystring} `.split(' ')[1];
                player2 = player2 == dummystring ? undefined : player2;
                break;
            case 'turn':
                let position = `${cp.commandValue} ${dummystring} `.split(' ')[1];
                position = position == dummystring ? undefined : position;
                if (!isNaN(Number(position))) {
                    return await this.turn(cp, sender, position);
                } else return `position ${position} is not available`;
            default:
                let err = 'Could not parse . . . please send ';
                err += '\'c?tictactoe start <username>\' or '
                err += '\'c?tictactoe turn <position>\'';
                return err;
        }
        if (player1 && player2 && board) {
            return <RichEmbed> {
                color: 3447003,
                title: `TICTACTOE (${sender}'s turn) . . . .`,
                description: TicTacToe.renderBoard(board),
                footer: {
                    text: `${player1},x,${player2},o,${board}`
                }
            };
        }
        else return 'ERR: could not compute';
    }

    private static async turn(cp: CommandParam, sender: string, position: string): Promise<RichEmbed | string> {
        let result = '';
        if (sender && position) return await cp.message.channel.fetchMessages({ limit: 20 })
            .then(messages => {
                // search for last message
                for (let key of messages.keyArray()) {
                    // that was sent by c3po
                    if (messages.get(key).member.user.username === 'c3po') {
                        const embed = messages.get(key).embeds.pop();
                        // and contains an embed with 'TICTACTOE' or 'TIC TAC TOE' in the title
                        if (embed && embed.title && (embed.title.indexOf('TICTACTOE') !== -1
                            || embed.title.indexOf('TIC TAC TOE') !== -1)) {
                            if (embed.title.indexOf('TIC TAC TOE') !== -1) {
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
                                            let title = `TICTACTOE (${otherplayer}'s turn) . . . .`;
                                            const newBoard = board.replace(position, xORo);
                                            let winner = this.checkForWin(newBoard);
                                            if (winner !== '') {
                                                if (winner === xORo) winner = sender;
                                                else winner = otherplayer;
                                                title = `${winner} won TIC TAC TOE`;
                                            }
                                            // send back new board
                                            return <RichEmbed> {
                                                color: 3447003,
                                                title: title,
                                                description: TicTacToe.renderBoard(newBoard),
                                                footer: {
                                                    text: `${otherplayer},${xORo === 'x' ? 'o' : 'x'},${sender},${xORo},${newBoard}`
                                                }
                                            };
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

    private static checkForWin(board: string): string {
        const row1 = [board[0], board[1], board[2]];
        const row2 = [board[3], board[4], board[5]];
        const row3 = [board[6], board[7], board[8]];
        const col1 = [board[0], board[3], board[6]];
        const col2 = [board[1], board[4], board[7]];
        const col3 = [board[2], board[5], board[8]];
        const diag1 = [board[0], board[4], board[8]];
        const diag2 = [board[2], board[4], board[6]];
        const checks = [row1, row2, row3, col1, col2, col3, diag1, diag2];
        let win = false;
        for (let check of checks) {
            let symbol = check[0];
            for (let char of check) {
                if (symbol !== char) {
                    symbol = '1';
                    break;
                }
            }
            if (symbol === 'x' || symbol === 'o') return symbol;
        }
        return '';
    }

    private static renderBoard(board: string): string {
        let result = '```';
        let row = 1;
        let col = 1;
        for (let char of board.split('')) {
            if (col == 1) result += '     |     |     \n';
            result += `  ${char}  `;
            col++;
            if (col > 3) {
                result += '\n     |     |     \n';
                if (row !== 3) result += '-----------------\n';
                col = 1;
                row++;
            } else result += '|'
        }
        result += '```';
        return result;
    }
}

import { CommandParam, Embed } from "../commands";
import { AbstractGame } from "./AbstractGame";

export function TicTacToe(cp: CommandParam): Promise<Embed | string> {

    const cmd = 'tictactoe';

    const title = 'TICTACTOE';

    const initialBoard = '123456789';

    const playTurn = (board, position, xORo) => board.replace(position, xORo);

    const checkForWin = (board: string): string => {
        const row1 = [board[0], board[1], board[2]];
        const row2 = [board[3], board[4], board[5]];
        const row3 = [board[6], board[7], board[8]];
        const col1 = [board[0], board[3], board[6]];
        const col2 = [board[1], board[4], board[7]];
        const col3 = [board[2], board[5], board[8]];
        const diag1 = [board[0], board[4], board[8]];
        const diag2 = [board[2], board[4], board[6]];
        const checks = [row1, row2, row3, col1, col2, col3, diag1, diag2];
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
        let tie = true;
        for (let i of ['1', '2', '3', '4', '5', '6', '7', '8', '9'])
            if (board.indexOf(i) !== -1) tie = false;
        if (tie) return 'xo';
        else return '';
    };

    const renderBoard = (board: string): string => {
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
    };

    return new AbstractGame(cmd, title, initialBoard, playTurn, checkForWin, renderBoard).compute(cp);
};

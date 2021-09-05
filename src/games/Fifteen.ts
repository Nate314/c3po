import { CommandParam, Embed } from "../commands";
import { AbstractGame } from "./AbstractGame";

export function Fifteen(cp: CommandParam): Promise<Embed | string> {

    let size = 9;

    if (cp.commandValue.startsWith('start')) {
        const sizeString = `${cp.commandValue} `.split(' ')[1];
        if (!!sizeString) {
            const candidateSize = Number(sizeString);
            if (!isNaN(candidateSize)) {
                if ([3, 8, 15].includes(candidateSize)) {
                    size = candidateSize + 1;
                } else {
                    return (async () => {
                        return `${candidateSize} is not a valid size for the fifteen game. Please choose a size of 3, 8, or 15.`;
                    })();
                }
            }
        }
    }

    const cmd = 'fifteen';

    const title = 'FIFTEEN';

    let initialBoard = Array(size).fill(null).map((_, i) => ((i + 1) === size) ? '' : `${(i + 1)}`).join('.');

    const players = 1;

    const isValidMove = (board: string, position: string): boolean => board.indexOf(position) !== -1;

    const playTurn = (board: string, position: number | string): { newBoard: string, nextPlayer: string } => {
        const tiles = board.split('.');
        const tile = position.toString();
        const sqrt = Math.sqrt(tiles.length);
        const tileIndex = tiles.indexOf(tile);
        const blankTileIndex = tiles.indexOf('');
        const tileRow = Math.floor(tileIndex / sqrt);
        const tileCol = tileIndex % sqrt;
        const blankTileRow = Math.floor(blankTileIndex / sqrt);
        const blankTileCol = blankTileIndex % sqrt;
        if ((Math.abs(tileIndex - blankTileIndex) === 1 && tileRow === blankTileRow)
            || (Math.abs(tileIndex - blankTileIndex) === sqrt && tileCol === blankTileCol)) {
                tiles[tileIndex] = '';
                tiles[blankTileIndex] = tile;
                return {
                    newBoard: tiles.join('.'),
                    nextPlayer: 'x'
                };
        } else return undefined;
    };

    const checkForWin = (board: string): string => {
        const tiles = board.split('.');
        let inOrder = true;
        let lastTile = Number(tiles[0]);
        for (let i = 1; i < tiles.length - 1; i++) {
            const thisTile = Number(tiles[i]);
            if (!isNaN(lastTile) && !isNaN(thisTile) && thisTile > lastTile) {
            } else {
                inOrder = false;
                break;
            }
            lastTile = thisTile;
        }
        return inOrder ? 'x' : '';
    };

    const renderBoard = (board: string): string => {
        const tiles = board.split('.');
        const sqrt = Math.sqrt(tiles.length);
        const pipes = `${Array(sqrt).fill('     ').join('|')}\n`;
        const line = `${Array((sqrt * 5) + sqrt - 1).fill('-').join('')}\n`;
        return `${'```'}${pipes + tiles.map((x, i) => {
            const stringified = x.toString();
            let result = `  ${stringified}${Array(2 - stringified.length).fill(' ').join('')} `;
            if ((i + 1) % sqrt === 0) {
                result += `\n${pipes}`;
                if (i < (sqrt * (sqrt - 1))) {
                    result += line + pipes;
                }
            } else {
                result += '|';
            }
            return result;
        }).join('')}${'```'}`;
    };

    if (cp.commandValue.startsWith('start')) {
        for (let i = 0; i < 100; i++) {
            const { newBoard } = playTurn(initialBoard, 1 + Math.floor(Math.random() * (size - 2)));
            initialBoard = newBoard || initialBoard;
        }
    }

    return new AbstractGame(cmd, title, initialBoard, players, isValidMove, playTurn, checkForWin, renderBoard).compute(cp);
};

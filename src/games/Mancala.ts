import { CommandParam, Embed } from "../commands";
import { AbstractGame } from "./AbstractGame";

const getBoardInfo = (board: string): { player1Bank: number, player1Pits: number[], player2Bank: number, player2Pits: number[] } => {
    const boardNums = board.split('.').map(x => +x);
    const [ player1Bank, ...player1Pits ] = boardNums.splice(0, 7);
    const [ player2Bank, ...player2Pits ] = boardNums;
    return { player1Bank, player1Pits, player2Bank, player2Pits };
}

export function Mancala(cp: CommandParam): Promise<Embed | string> {

    const cmd = 'mancala';

    const title = 'MANCALA';

    const initialBoard = '0.4.4.4.4.4.4.0.4.4.4.4.4.4';

    const players = 2;

    const isValidMove = (board: string, position: string, xORo: string): boolean => {
        const { player1Pits, player2Pits } = getBoardInfo(board);
        const positionIndex = +position - 1;
        if (positionIndex >= 0 && positionIndex <= 5) {
            return xORo === 'x' ? player1Pits[positionIndex] !== 0 : player2Pits[positionIndex] !== 0;
        }
        return false;
    }

    const playTurn = (board: string, position: string, xORo: string): { newBoard: string, nextPlayer: string } => {
        const { player1Bank, player1Pits, player2Bank, player2Pits } = getBoardInfo(board);
        let [ newPlayer1Bank, newPlayer1Pits, newPlayer2Bank, newPlayer2Pits ] = [ player1Bank, player1Pits, player2Bank, player2Pits ];

        let nextPlayer = undefined;

        const distributeSeeds = (startIndex: number, sideOfBoard: string, seedsInHand: number, recursionCount: number) => {
            console.log(`distributeSeeds(${startIndex}, ${sideOfBoard}, ${seedsInHand})`);
            // grab seeds
            if (seedsInHand == 0 && startIndex >= 0) {
                if (sideOfBoard === 'x') {
                    console.log(`x grabbing seeds`);
                    seedsInHand = newPlayer1Pits[startIndex];
                    newPlayer1Pits[startIndex] = 0;
                } else {
                    console.log(`o grabbing seeds`);
                    seedsInHand = newPlayer2Pits[startIndex];
                    newPlayer2Pits[startIndex] = 0;
                }
                startIndex--;
            }
            console.log(`seedsInHand = ${seedsInHand}`);

            let finalIndex = -1;
            for (let i = startIndex; i >= 0; i--) {
                const tempLog = () => {
                    console.log(`dropping seed, ${sideOfBoard}, [${(sideOfBoard === 'x' ? newPlayer1Pits : newPlayer2Pits).join(', ')}]`);
                    console.log(`seedsInHand = ${seedsInHand}`);
                };
                if (seedsInHand) {
                    if (sideOfBoard === 'x') {
                        newPlayer1Pits[i]++;
                    } else {
                        newPlayer2Pits[i]++;
                    }
                }
                seedsInHand--;
                tempLog();
                if (seedsInHand == 0) {
                    finalIndex = i;
                    break;
                }
            }
            console.log(`finalIndex = ${finalIndex}`);
            
            if (finalIndex >= 0) {
                // landing on same side
                if (
                    (sideOfBoard === 'x' && newPlayer1Pits[finalIndex] > 1)
                    || (sideOfBoard === 'o' && newPlayer2Pits[finalIndex] > 1)
                ) {
                    console.log(`landing on same side`);
                    // if there were seeds in the spot the player landed
                    distributeSeeds(finalIndex, sideOfBoard, 0, recursionCount + 1);
                } else {
                    console.log(`landed in empty spot`);
                    nextPlayer = xORo === 'x' ? 'o' : 'x';
                }
            } else {
                // seeds still in hand
                console.log(`seeds still in hand`);
                const isOnCurrentPlayerSide = xORo === sideOfBoard;
                console.log(`isOnCurrentPlayerSide = ${isOnCurrentPlayerSide}`);
                if (isOnCurrentPlayerSide) {
                    seedsInHand--;
                    if (xORo === 'x') {
                        newPlayer1Bank++;
                    } else {
                        newPlayer2Bank++;
                    }
                }
                console.log(`newPlayer1Bank = ${newPlayer1Bank}`);
                console.log(`newPlayer2Bank = ${newPlayer2Bank}`);
                if (isOnCurrentPlayerSide && (seedsInHand === 0)) {
                    // landed in bank, so current player plays again
                    console.log(`landed in bank, so current player plays again`);
                    nextPlayer = xORo;
                } else {
                    // continue placing seeds in opponent's pits
                    distributeSeeds(5, sideOfBoard === 'x' ? 'o' : 'x', seedsInHand, recursionCount + 1);
                }
            }
        };

        try {
            distributeSeeds(+position - 1, xORo, 0, 0);
        } catch (error) {
            console.log(error);
        }


        const newBoard = `${newPlayer1Bank}.${newPlayer1Pits.join('.')}.${newPlayer2Bank}.${newPlayer2Pits.join('.')}`;

        // check if next player has a valid move
        if (Array(6).fill(0).map((_, i) => isValidMove(newBoard, `${i + 1}`, nextPlayer)).includes(true)) {
            // next player has a valid move
            console.log(`${nextPlayer} will have a valid move`);
        } else {
            // no valid move, swap next player
            console.log(`${nextPlayer} will not have a valid move, swapping`);
            nextPlayer = nextPlayer === 'x' ? 'o' : 'x';
        }
        console.log(`nextPlayer = ${nextPlayer}`);

        return {
            newBoard,
            nextPlayer
        };
    };

    const checkForWin = (board: string): string => {
        const { player1Bank, player1Pits, player2Bank, player2Pits } = getBoardInfo(board);
        const isGameInProgress = player1Pits.find(x => x !== 0) || player2Pits.find(x => x !== 0);
        return isGameInProgress ? '' : player1Bank > player2Bank ? 'x' : player2Bank > player1Bank ? 'o' : 'xo';
    };

    const renderBoard = (board: string): string => {
        return `renderBoard('${board}') not implemented`;
    };

    return new AbstractGame(cmd, title, initialBoard, players, isValidMove, playTurn, checkForWin, renderBoard).compute(cp);
};

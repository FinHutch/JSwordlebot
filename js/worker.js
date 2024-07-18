console.log("working");
import { GameLogic } from './gameLogic.js'; // Ensure the correct relative path

let gameLogicInstance;
let abortController = null;

// Function to handle incoming messages
self.onmessage = async function(event) {
    // Create a new AbortController for this computation
    try {
        const { rows, columns, answerList, guessList, characters, clickCounts, lastActivatedRow, bigPool } = event.data;

        // Initialize GameLogic instance if it doesn't exist
        if (!gameLogicInstance) {
            console.log('Initializing GameLogic instance');
            gameLogicInstance = new GameLogic(rows, columns, answerList, guessList);
        }

        // Perform heavy computation (gameLogicInstance.calculate)
        const result = await gameLogicInstance.calculate(characters, clickCounts, lastActivatedRow, bigPool);
        console.log('Worker calculated result:', result);
        self.postMessage(result);
    } catch (error) {
        console.error('Error during computation:', error);
        self.postMessage('Error during computation');
    } finally {
        // Reset abortController after computation is done or aborted
        abortController = null;
    }
};

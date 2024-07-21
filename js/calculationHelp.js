import { GameLogic,fetchWordList } from './gameLogic.js';
//This file is to compute the best second guesses for a given word when needed.

document.addEventListener('DOMContentLoaded', async () => {
    let colours;
    let info;
    let wordlist;
    let bestGuess;
    const answerlist = await fetchWordList('../assets/possibleAnswers.txt');
    const guesslist = await fetchWordList('../assets/possibleGuesses.txt');
    const gamelogic = new GameLogic(6,5,'../assets/possibleAnswers.txt','../assets/possibleGuesses.txt');
    function base3ToBase10(base3) {
        let base10 = 0;
        const length = base3.length;

        for (let i = 0; i < length; i++) {
            const digit = parseInt(base3[length - 1 - i], 10);
            base10 += digit * Math.pow(3, i);
        }

        return base10;
    }

   

    function bestSecondGuess(guess){

        const results = [guess];
        
        // Iterate over all positions in the array
        for (let i = 0; i <= 2; i++) {
            for (let j = 0; j <= 2; j++) {
                for (let k = 0; k <= 2; k++) {
                    for (let l = 0; l <= 2; l++) {
                        for (let m = 0; m <= 2; m++) {
                            // Create an array with the current combination
                            colours = [i, j, k, l, m];
                            info = gamelogic.getInfo(guess,colours);
                            wordlist = gamelogic.reduceList(info,answerlist);
                            bestGuess= gamelogic.findBestGuess(wordlist,guesslist);
                            console.log(bestGuess,);
                            results.push(bestGuess);

                        }
                    }
                }
            }
        }
        
        return results;
    }
    let array = bestSecondGuess('crate');
    console.log(JSON.stringify(array, null, 2));
});
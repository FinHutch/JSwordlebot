class LetterInfo {
    constructor(letter, position, occurrences, numberKnown, validity = true) {
        this.letter = letter;
        this.position = position;
        this.occurrences = occurrences;
        this.numberKnown = numberKnown;
        this.validity = validity;
    }
}

export class GameLogic {
    constructor(rows, columns, answerList, guessList,secondGuessesList) {
        this.ROWS = rows;
        this.COLUMNS = columns;
        this.answerListPromise = fetchWordList(answerList);
        this.guessListPromise = fetchWordList(guessList);
        this.letterInfoList = [];
        this.bestSecondGuesses = fetchGuessesList(secondGuessesList);
        this.bestFirstGuesses = ['crane','slate','trace','crate','caret','carte','plate','stare']
    }

    async initialize() {
        this.answerList = await this.answerListPromise;
        this.guessList = await this.guessListPromise;
        this.secondGuesses = await this.bestSecondGuesses;
    }

    async calculate(characters, clickCounts, lastActivatedRow, bigPool = false, randomStartingGuess = false) {
        // calculate the best guess given the scenario
        await this. initialize(); // Ensure the lists are fully loaded before calculation

        let allLetterInfo = this.addRowInformation(characters, clickCounts, lastActivatedRow, bigPool);

        if (lastActivatedRow === -1) {
            if (randomStartingGuess){
                
                return this.bestFirstGuesses[Math.floor(Math.random() * this.bestFirstGuesses.length)];
            }else{
                return "crate";
            }
        } else if (lastActivatedRow === 0) {
            let firstGuess = characters[0].join('');
            let colours = this.getModulo3List(clickCounts[0]);
            colours = this.base3ToBase10(colours.join(''))
            let guessIndex = this.secondGuesses.findIndex(subArray => subArray[0] === firstGuess);
            if (guessIndex != -1) {
                let nextGuess = this.secondGuesses[guessIndex][colours+1];
                if (nextGuess != ' '){return nextGuess;}
                
            }
           
        }
        if (clickCounts[lastActivatedRow].every(value => value % 3 === 2)){
            return "solved";
        }

        let wordList = bigPool ? this.guessList : this.answerList;
        wordList = this.reduceList(allLetterInfo, wordList);
        let nextGuess;
        if (lastActivatedRow ==4){
            nextGuess = this.findBestGuess(wordList, this.answerList); 
        }else{
            nextGuess = this.findBestGuess(wordList, this.guessList);
        }
        

        if (wordList.length === 0) {
            if (bigPool) {
                return '';
            } else {
                return await this.calculate(characters, clickCounts, lastActivatedRow, true);
            }
        }

        

        return nextGuess;
    }

    getModulo3List(array) {
        //the colour of the tile is the number of clicks modulo 3
        return array.map(value => value % 3);
    }

    addRowInformation(characters, clickCounts, lastActivatedRow) {
        // adds the most recent word to the data
        let mainInfo = [];
        for (let row = 0; row <= lastActivatedRow; row++) {
            let clickCountsForRowList = Array.from(clickCounts[row]);
            let rowInfo = this.getInfo(characters[row], clickCountsForRowList);
            mainInfo = this.combineLetterInfos(mainInfo, rowInfo);
        }
        return mainInfo;
    }

    combineLetterInfos(letterInfoList1, letterInfoList2) {
        //combines the information from seperate words into one set of information
        for (let letter2 of letterInfoList2) {
            let sharedInfo = false;
            for (let i = 0; i < letterInfoList1.length; i++) {
                let letter1 = letterInfoList1[i];
                if (letter2.letter === letter1.letter) {
                    sharedInfo = true;
                    let combinedInfo = this.compareLetterInfo(letter1, letter2);
                    if (!combinedInfo.validity) {
                        letterInfoList1 = [];
                        return letterInfoList1;
                    } else {
                        letterInfoList1[i] = combinedInfo;
                    }
                }
            }
            if (!sharedInfo) {
                letterInfoList1.push(letter2);
            }
        }
        return letterInfoList1;
    }

    getInfo(word, wordColours) {
        //converts the colours into useful information for the guesser
        let tempList = [];
        let letters = Array(this.COLUMNS).fill(null);
        let lettersFound = 0;
        for (let i = 2; i >= 0; i--) {
            for (let col = 0; col < this.COLUMNS; col++) {
                let currLetter = word[col];
                let occurrences;
                let currColour = wordColours[col] % 3;
                let foundIndex = letters.indexOf(currLetter);
                let position = Array(this.COLUMNS).fill(0);
                if (foundIndex === -1 && currColour === i) {
                    letters[lettersFound] = currLetter;
                    lettersFound++;
                    switch (currColour) {
                        case 0:
                            position.fill(2);
                            tempList.push(new LetterInfo(currLetter, position, 0, true));
                            break;
                        case 1:
                            position[col] = 2;
                            tempList.push(new LetterInfo(currLetter, position, 1, false));
                            break;
                        case 2:
                            position[col] = 1;
                            tempList.push(new LetterInfo(currLetter, position, 1, false));
                            break;
                    }
                } else if (currColour === i) {
                    occurrences = tempList[foundIndex].occurrences;
                    let numberKnown = tempList[foundIndex].numberKnown;
                    position = tempList[foundIndex].position;
                    switch (currColour) {
                        case 0:
                            numberKnown = true;
                            position[col] = 2;
                            break;
                        case 1:
                            occurrences++;
                            position[col] = 2;
                            break;
                        case 2:
                            position[col] = 1;
                            occurrences++;
                            break;
                    }
                    tempList[foundIndex] = new LetterInfo(currLetter, position, occurrences, numberKnown);
                }
            }
        }
        return tempList;
    }

    compareLetterInfo(letter1, letter2) {
        //gives information for a new instance of letter
        if (letter2.numberKnown && !letter1.numberKnown) {
            return this.compareLetterInfo(letter2, letter1);
        }
        let position = Array(this.COLUMNS).fill(0);
        let numberKnown = false;
        let validity = true;
        let occurrences = 0;
        let letter = letter1.letter;
        if (letter1.numberKnown) {
            if (letter2.numberKnown) {
                if (letter1.occurrences !== letter2.occurrences) {
                    validity = false;
                }
                numberKnown = true;
            }
            if (letter2.occurrences > letter1.occurrences) {
                validity = false;
            }
        }
        occurrences = Math.max(letter2.occurrences, letter1.occurrences);
        for (let i = 0; i < this.COLUMNS; i++) {
            let higherVal = Math.max(letter1.position[i], letter2.position[i]);
            let lowerVal = Math.min(letter1.position[i], letter2.position[i]);
            if (higherVal === 2 && lowerVal === 1) {
                validity = false;
            } else if (higherVal === 2) {
                position[i] = 2;
            } else if (higherVal === 1) {
                position[i] = 1;
            }
        }
        return new LetterInfo(letter, position, occurrences, numberKnown, validity);
    }

    reduceList(conditions, words) {
        // breaks down the list into only words that meet the requirements of the wordle state
        if (!Array.isArray(words)) {
            console.error('Words is not an array:', words);
            return [];
        }
        return words.filter(word => this.fitsConditions(word, conditions));
    }

    fitsConditions(word, conditions) {
        // figures out if a word is valid given the current wordle state
        for (let letterInfo of conditions) {
            let letterCount = 0;
            let letter = letterInfo.letter;
            let position = letterInfo.position;
            let occurrences = letterInfo.occurrences;
            for (let i = 0; i < this.COLUMNS; i++) {
                if (word[i] === letter) {
                    letterCount++;
                    if (position[i] === 2) return false;
                } else if (position[i] === 1) return false;
            }
            if (letterCount < occurrences) return false;
            if (letterInfo.numberKnown && letterCount !== occurrences) return false;
        }
        return true;
    }

    findBestGuess(wordList, guessList) {
        // calculates the best guess given the average words remaining in each guess
        let topScore = 3000;
        let topGuess = " ";
        for (let guess of guessList) {
            let averageWordsLeft = this.findAverageWordsLeft(guess, wordList);
            if (averageWordsLeft < topScore) {
                topGuess = guess;
                topScore = averageWordsLeft;
            }
        }
        return topGuess;
    }

    findAverageWordsLeft(guess, wordList) {
        //finds the average words left given the guess
        //uses maps to decrease computation time
        let score = 0;
        const size = wordList.length;
        const colourOccurrences = new Map();
    
        // Iterate over each word in the wordList
        for (const tempAnswer of wordList) {
            const coloursList = this.getColours(guess, tempAnswer);
    
            // Convert the colours array to a string key for the Map
            const key = JSON.stringify(coloursList);
    
            // Update the colourOccurrences map
            colourOccurrences.set(key, (colourOccurrences.get(key) || 0) + 1);
        }
    
        // Iterate over each entry in the colourOccurrences map
        for (const [key, occurrenceCount] of colourOccurrences.entries()) {
            let tempList = [...wordList]; // Copy the wordList
            const coloursList = JSON.parse(key); // Convert the key back to an array
    
            // Get the temporary information based on the guess and colours list
            const tempInfo = this.getInfo(guess.split(''), coloursList);
    
            // Reduce the tempList based on the temporary information
            tempList = this.reduceList(tempInfo, tempList);
    
            const containsOnlyGuess = tempList.length === 1 && tempList[0] === guess;
    
            if (!containsOnlyGuess) {
                score += tempList.length * occurrenceCount;
            }
        }
    
        return score / size;
    }

    sameColours(list1, list2) {

        return list1.length === list2.length && list1.every((value, index) => value === list2[index]);
    }

    calculateScore(word, guess) {
        // I can't remember what this one does
        let score = Array(this.COLUMNS).fill(0);
        let occurrences = Array(this.COLUMNS).fill(0);
        for (let i = 0; i < this.COLUMNS; i++) {
            if (word[i] === guess[i]) {
                score[i] = 2;
            }
        }
        for (let i = 0; i < this.COLUMNS; i++) {
            if (score[i] === 2) {
                occurrences[guess.charCodeAt(i) - 97]++;
            }
        }
        for (let i = 0; i < this.COLUMNS; i++) {
            if (score[i] !== 2) {
                for (let j = 0; j < this.COLUMNS; j++) {
                    if (score[j] !== 2 && word[j] === guess[i] && occurrences[guess.charCodeAt(i) - 97] < this.COLUMNS) {
                        score[i] = 1;
                        occurrences[guess.charCodeAt(i) - 97]++;
                    }
                }
            }
        }
        return score;
    }
    getColours(guess, answer) {
        // gets the colours that the guess would generate
        const coloursGuess = Array(guess.length).fill(0);
        const coloursAnswer = Array(guess.length).fill(0);
    
        // First pass: set colours to 2 where characters match
        for (let i = 0; i < coloursAnswer.length; i++) {
            if (guess.charAt(i) === answer.charAt(i)) {
                coloursGuess[i] = 2;
                coloursAnswer[i] = 2;
            }
        }
    
        // Second pass: set colours to 1 where characters match but positions don't
        for (let i = 0; i < coloursAnswer.length; i++) {
            if (coloursAnswer[i] !== 0) {
                continue;
            }
            for (let j = 0; j < coloursGuess.length; j++) {
                if (coloursGuess[j] !== 0) {
                    continue;
                }
                if (guess.charAt(j) === answer.charAt(i)) {
                    coloursGuess[j] = 1;
                    coloursAnswer[i] = 1;
                    break;
                }
            }
        }
    
        return coloursGuess;
    }
    base3ToBase10(base3) {
        //converts a base 3 number to a base 10 number this is used to go through all the colours
        let base10 = 0;
        const length = base3.length;

        for (let i = 0; i < length; i++) {
            const digit = parseInt(base3[length - 1 - i], 10);
            base10 += digit * Math.pow(3, i);
        }

        return base10;
    }
    getAnswerList() {
        return answerList;  
    }

    getGuessList() {
        return guessList;  
    }
}

export async function fetchWordList(fileName) {
    // fetches the word list from a file
    try {
        const response = await fetch(fileName); // Wait for the fetch operation to complete
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        const data = await response.text(); // Wait for the text data from the response
        
        // Use a regular expression to keep only alphanumeric words
        const wordList = data
            .split(/\s+/) // Split the text into words based on whitespace (including \r\n, \n, and spaces)
            .filter(word => /^[a-zA-Z0-9]+$/.test(word)); // Keep only alphanumeric words
        
        return wordList;
    } catch (error) {
        console.error('Error fetching the file:', error);
        return []; // Return an empty array in case of error
    }
}

export async function fetchGuessesList(fileName) {
    //fetches all 5 letter words from a file including those that aren't in guesslist
    try {
        const response = await fetch(fileName); // Wait for the fetch operation to complete
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        const data = await response.text(); // Wait for the text data from the response
        
        // Remove any unwanted characters and parse the content
        const cleanedData = data.trim();
        
        // Convert string to JavaScript object
        const wordList = JSON.parse(cleanedData); // Convert string to JavaScript object
        
        // Ensure it's a 2-dimensional array
        if (Array.isArray(wordList) && wordList.every(subArray => Array.isArray(subArray))) {
            return wordList;
        } else {
            throw new Error('Invalid file format');
        }
    } catch (error) {
        console.error('Error fetching the file:', error);
        return []; // Return an empty array in case of error
    }
}



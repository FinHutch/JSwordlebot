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
    constructor(rows, columns, answerList, guessList) {
        this.ROWS = rows;
        this.COLUMNS = columns;
        this.answerListPromise = fetchWordList(answerList);
        this.guessListPromise = fetchWordList(guessList);
        this.letterInfoList = [];
        this.bestSecondGuessesMap = new Map();
    }

    async initialize() {
        this.answerList = await this.answerListPromise;
        this.guessList = await this.guessListPromise;
    }

    async calculate(characters, clickCounts, lastActivatedRow, bigPool = false) {
        await this.initialize(); // Ensure the lists are fully loaded before calculation

        let allLetterInfo = this.addRowInformation(characters, clickCounts, lastActivatedRow, bigPool);

        if (lastActivatedRow === -1) {
            return "next guess: crate";
        } else if (lastActivatedRow === 0) {
            let firstGuess = characters[0].join('');
            let colours = this.getModulo3List(clickCounts[0]);
            if (this.bestSecondGuessesMap.has(firstGuess)) {
                let nextGuess = this.bestSecondGuessesMap.get(firstGuess).get(colours);
                return `next guess: ${nextGuess}`;
            }
        }

        let wordList = bigPool ? this.guessList : this.answerList;
        wordList = this.reduceList(allLetterInfo, wordList);

        let nextGuess = this.findBestGuess(wordList, this.guessList);

        if (allLetterInfo.length === 0) {
            if (bigPool) {
                return 'No available words!';
            } else {
                return await this.calculate(characters, clickCounts, lastActivatedRow, true);
            }
        }

        if (nextGuess === " ") {
            return "No available words!";
        }

        return `next guess: ${nextGuess}`;
    }

    getModulo3List(array) {
        return array.map(value => value % 3);
    }

    addRowInformation(characters, clickCounts, lastActivatedRow) {
        let mainInfo = [];
        for (let row = 0; row <= lastActivatedRow; row++) {
            let clickCountsForRowList = Array.from(clickCounts[row]);
            let rowInfo = this.getInfo(characters[row], clickCountsForRowList);
            mainInfo = this.combineLetterInfos(mainInfo, rowInfo);
        }
        return mainInfo;
    }

    combineLetterInfos(letterInfoList1, letterInfoList2) {
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
        if (!Array.isArray(words)) {
            console.error('Words is not an array:', words);
            return [];
        }
        return words.filter(word => this.fitsConditions(word, conditions));
    }

    fitsConditions(word, conditions) {
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
        let score = 0;
        let size = wordList.length;
        let colourList = [];
        for (let word of wordList) {
            let scoreLine = this.calculateScore(word, guess);
            let found = false;
            for (let i = 0; i < colourList.length; i++) {
                let colourArray = colourList[i];
                if (this.sameColours(scoreLine, colourArray[0])) {
                    found = true;
                    colourArray[1]++;
                    break;
                }
            }
            if (!found) {
                colourList.push([scoreLine, 1]);
            }
        }
        for (let colourArray of colourList) {
            let numberWords = colourArray[1];
            score += (numberWords * numberWords);
        }
        return score / size;
    }

    sameColours(list1, list2) {
        return list1.length === list2.length && list1.every((value, index) => value === list2[index]);
    }

    calculateScore(word, guess) {
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

    getAnswerList() {
        return ["hello", "world", "crate"];  // Simplified
    }

    getGuessList() {
        return ["hello", "world", "crate", "other"];  // Simplified
    }
}

async function fetchWordList(fileName) {
    try {
        const response = await fetch(fileName); // Wait for the fetch operation to complete
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        const data = await response.text(); // Wait for the text data from the response
        const wordList = data.trim().split('\n');
        return wordList;
    } catch (error) {
        console.error('Error fetching the file:', error);
        return []; // Return an empty array in case of error
    }
}

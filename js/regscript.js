import { GameLogic, fetchWordList } from './gameLogic.js';

document.addEventListener('DOMContentLoaded', async () => {

    const gameModal = document.getElementById('gameModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const continueBtn = document.getElementById('continueBtn');

    const ROWS = 6;
    const COLUMNS = 5;
    const answerList = '../assets/possibleAnswers.txt';
    const guessList = '../assets/possibleGuesses.txt';
    const secondGuessesList = '../assets/secondGuesses.txt';
    let buttons = [];
    let playerSolved = false;
    let clickCounts = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
    let characters = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(' '));
    let lastActivatedRow = -1;
    let currentColumn = 0;
    const answerlist = await fetchWordList(answerList);
    const guesslist = await fetchWordList(guessList);
    const gamelogic = new GameLogic(ROWS,COLUMNS,answerList,guessList,secondGuessesList);
    let answer = getRandomString(answerlist);

    const titleLabel1 = document.getElementById('titleLabel');
    const gridPane1 = document.getElementById('gridPane');


    // Initialize the worker
    
    function initializeButtons() {
        for (let row = 0; row < ROWS; row++) {
            buttons[row] = [];
            buttons[row] = [];
            for (let col = 0; col < COLUMNS; col++) {
                const button = document.createElement('button');

                button.style.backgroundColor = 'white';
                button.disabled = true;
                gridPane1.appendChild(button);
                buttons[row][col] = button;
            }
        }
    }

    function updateTitleText(newText) {
        titleLabel.textContent = newText;
    }




    function activateNextRow() {
        
        if (lastActivatedRow < ROWS - 1) {
            if(guesslist.includes(characters[lastActivatedRow+1].join(''))){
                currentColumn = 0;
                lastActivatedRow++;
                if(characters[lastActivatedRow].join('') == answer){ playerSolved =1+lastActivatedRow;updateColours1(lastActivatedRow);}
                if (!playerSolved){
                    updateColours(lastActivatedRow);
                    if (lastActivatedRow == ROWS -1 ){
                        showGameModal("fail");
        
                    } 
                    
                    return
                } 
                
                else if (playerSolved){
                    showGameModal("win");
                    return
                }
                
                
            }
        }
        
    }
    
    function updateColours(row) {
        clickCounts[row] = gamelogic.getColours(characters[row].join(''), answer);
        
    
        for (let col = 0; col < clickCounts[row].length; col++) {
            if (clickCounts[row][col] === 0) {
                buttons[row][col].style.backgroundColor = 'grey';
            } else if (clickCounts[row][col] === 1) {
                buttons[row][col].style.backgroundColor = 'yellow';
            } else if (clickCounts[row][col] === 2) {
                buttons[row][col].style.backgroundColor = 'green';
            }
    
        }
    }
    function deactivateLastRow() {
        if (lastActivatedRow >= 0) {
            for (let col = 0; col < COLUMNS; col++) {
                buttons[lastActivatedRow][col].disabled = true;
                buttons[lastActivatedRow][col].style.backgroundColor = 'white';
                buttons[lastActivatedRow][col].textContent = '';
                clickCounts[lastActivatedRow][col] = 0;
            }
            lastActivatedRow--;
            if (lastActivatedRow >= 0) {
                currentColumn = 0;
            }
        }
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            activateNextRow();
    
        } else if (event.key === 'Backspace') {
            if (currentColumn === 0) {
                
            } else {
                currentColumn--;
                buttons[lastActivatedRow + 1][currentColumn].textContent = ' ';
            }
        } else {
            const letter = event.key;
            typeLetter(letter);
        }
    }

    function typeLetter(letter) {
        if (letter.length === 1 && /[a-zA-Z]/.test(letter) && currentColumn < COLUMNS) {
            buttons[lastActivatedRow + 1][currentColumn].textContent = letter.toUpperCase();
            characters[lastActivatedRow + 1][currentColumn] = letter;
            currentColumn++;
        }
    }

     // Function to show the modal
     function showGameModal(state, disableContinue = true) {
        // Update modal title and message based on the state
        switch(state) {
            case 'fail':
                modalTitle.innerText = 'Epic Fail!';
                modalMessage.innerText = 'Would you like to try again or continue?';
                break;
            case 'win':
                modalTitle.innerText = 'You Win!';
                modalMessage.innerText = 'Would you like to try again?';
                break;
            case 'tie':
                modalTitle.innerText = 'It\'s a Tie!';
                modalMessage.innerText = 'Would you like to try again?';
                break;
        }
    
        // Remove or show the "Continue" button based on disableContinue
        if (disableContinue) {
            if (continueBtn.parentElement) {
                continueBtn.parentElement.removeChild(continueBtn); // Remove the button from the DOM
            }
        } else {
            // If continue button is removed and should be added back
            if (!document.getElementById('continueBtn')) {
                // Assuming you want to re-add the button, adjust as needed
                gameModal.appendChild(continueBtn);
            }
            continueBtn.style.display = 'inline-block'; // Make sure it is visible
        }
    
        // Display the modal
        gameModal.style.display = 'block';
    }
    
    

    // Function to hide the modal
    function hideGameModal() {
        gameModal.style.display = 'none';
    }

    // Event listeners for the buttons
    tryAgainBtn.addEventListener('click', () => {
        hideGameModal();
        location.reload();
        // Add your "try again" logic here
        console.log("Try Again clicked");
    });

    continueBtn.addEventListener('click', () => {
        hideGameModal();
        // Add your "continue" logic here
    });
    
    

    // Example of how to call the showFailModal function
    // You can call this function wherever needed in your code

    document.addEventListener('keydown', handleKeyPress);

    initializeButtons();
    
    gridPane1.focus();
});

function getRandomString(stringList) {
    if (stringList.length === 0) {
        throw new Error('The list is empty.');
    }

    // Generate a random index
    const randomIndex = Math.floor(Math.random() * stringList.length);
    
    // Return the string at the random index
    return stringList[randomIndex];
}
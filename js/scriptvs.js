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
    let buttons1 = [];
    let buttons2 = [];
    let calculating = true;
    let playerSolved = false;
    let computerSolved = false;
    let clickCounts1 = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
    let clickCounts2 = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
    let characters1 = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(' '));
    let characters2 = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(' '));
    let lastActivatedRow = -1;
    let currentColumn = 0;
    const answerlist = await fetchWordList(answerList);
    const guesslist = await fetchWordList(guessList);
    const gamelogic = new GameLogic(ROWS,COLUMNS,answerList,guessList,secondGuessesList);
    let answer = getRandomString(answerlist);

    const titleLabel1 = document.getElementById('titleLabel1');
    const gridPane1 = document.getElementById('gridPane1');

    const titleLabe2 = document.getElementById('titleLabel2');
    const gridPane2 = document.getElementById('gridPane2');

    // Initialize the worker
    let worker= null; 

    // Handle messages from the worker
    
    function terminateWorker() {
        if (worker) {
            worker.terminate();
            worker = null;
            console.log('Worker terminated');
        } else {
            console.error('Worker is not running');
        }
    }
    function initializeButtons() {
        for (let row = 0; row < ROWS; row++) {
            buttons1[row] = [];
            buttons2[row] = [];
            for (let col = 0; col < COLUMNS; col++) {
                const button1 = document.createElement('button');
                const button2 = document.createElement('button');
                button1.style.backgroundColor = 'white';
                button2.style.backgroundColor = 'white';
                button1.disabled = true;
                button2.disabled = true;
                gridPane1.appendChild(button1);
                gridPane2.appendChild(button2);
                buttons1[row][col] = button1;
                buttons2[row][col] = button2;
            }
        }
    }

    function updateTitleText1(newText) {
        titleLabel1.textContent = newText;
    }
    function updateTitleText2(newText) {
        titleLabel2.textContent = newText;
    }



    function manageCalculationThread() {
        updateTitleText2("I'm thinking...");
        // Send data to the worker
        calculating = true;
        if (worker) {
            worker.terminate();
            worker = null;
            console.log('Worker terminated');
        } 
        worker = new Worker('./js/worker.js', { type: 'module' });
        worker.onmessage = function(event) {
            const result = event.data;
            characters2[lastActivatedRow+1] = result.split('');
            if (result == 'solved'){
                computerSolved=lastActivatedRow;
            }else{
                updateTitleText2("ready to move!")
            }
           calculating = false;
        };
        const data = {
            rows: ROWS,
            columns: COLUMNS,
            answerList,
            guessList,
            secondGuessesList,
            characters: characters2,
            clickCounts: clickCounts2,
            lastActivatedRow,
            bigPool: false
        };
        worker.postMessage(data);
    }

    function activateNextRow() {
        
        if (lastActivatedRow < ROWS - 1 && calculating == false) {
            if(guesslist.includes(characters1[lastActivatedRow+1].join(''))){
                currentColumn = 0;
                lastActivatedRow++;
                if(characters1[lastActivatedRow].join('') == answer && !playerSolved){ playerSolved =1+lastActivatedRow;updateColours1(lastActivatedRow);}
                if(characters2[lastActivatedRow].join('') == answer && !computerSolved){computerSolved =1+ lastActivatedRow;updateColours2(lastActivatedRow);}
                if (!playerSolved && !computerSolved){
                    updateColours1(lastActivatedRow);
                    updateColours2(lastActivatedRow);
                    manageCalculationThread();
                } else if (playerSolved && !computerSolved) {
                    updateColours2(lastActivatedRow);
                    manageCalculationThread();
                    showComputerLetters();
                    // Wait for `calculating` to become false before continuing
                    waitForVariableChange(() => calculating, false).then(() => {
                        currentColumn = COLUMNS;
                        activateNextRow();
                        updateTitleText1("calculating...");
                    });
                }
                else if (computerSolved && !playerSolved){
                    if (computerSolved==lastActivatedRow+1){
                        showGameModal('fail',false)
                        updateColours1(lastActivatedRow);
                    }
                    else
                    {
                        updateColours1(lastActivatedRow);
                        updateTitleText2("ha I win!")
                    }
                }
                else if (computerSolved && playerSolved){
                    showComputerLetters();
                    if (computerSolved==playerSolved){
                    updateTitleText2("it's a tie")}
                    else if (computerSolved>playerSolved){
                        showGameModal("win");
                    }else{
                        showGameModal("fail",false);
                    }
    
                }
                
                if (lastActivatedRow == ROWS -1 &&calculating == false){
                    if (playerSolved ==computerSolved){showGameModal('tie');}
                    else if (!playerSolved){showGameModal('fail')}
                    else {showGameModal('win');}
                } 
            }
        }
    }
    
    function updateColours1(row) {
        clickCounts1[row] = gamelogic.getColours(characters1[row].join(''), answer);
        
    
        for (let col = 0; col < clickCounts1[row].length; col++) {
            if (clickCounts1[row][col] === 0) {
                buttons1[row][col].style.backgroundColor = 'grey';
            } else if (clickCounts1[row][col] === 1) {
                buttons1[row][col].style.backgroundColor = 'yellow';
            } else if (clickCounts1[row][col] === 2) {
                buttons1[row][col].style.backgroundColor = 'green';
            }
    
        }
    }
    function updateColours2(row) {
        clickCounts2[row] = gamelogic.getColours(characters2[row].join(''), answer);
        
        for (let col = 0; col < clickCounts1[row].length; col++) {
            if (clickCounts2[row][col] === 0) {
                buttons2[row][col].style.backgroundColor = 'grey';
            } else if (clickCounts2[row][col] === 1) {
                buttons2[row][col].style.backgroundColor = 'yellow';
            } else if (clickCounts2[row][col] === 2) {
                buttons2[row][col].style.backgroundColor = 'green';
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
                buttons1[lastActivatedRow + 1][currentColumn].textContent = ' ';
            }
        } else {
            const letter = event.key;
            typeLetter(letter);
        }
    }

    function typeLetter(letter) {
        if (letter.length === 1 && /[a-zA-Z]/.test(letter) && currentColumn < COLUMNS) {
            buttons1[lastActivatedRow + 1][currentColumn].textContent = letter.toUpperCase();
            characters1[lastActivatedRow + 1][currentColumn] = letter;
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
    function waitForVariableChange(variableGetter, value) {
        return new Promise((resolve) => {
            function check() {
                if (variableGetter() === value) {
                    resolve();
                } else {
                    requestAnimationFrame(check);
                }
            }
            requestAnimationFrame(check);
        });
    }
    function showComputerLetters() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {
                const button = buttons2[row][col];
                button.textContent = characters2[row][col].toUpperCase();
            }
        }
    }

    // Example of how to call the showFailModal function
    // You can call this function wherever needed in your code

    document.addEventListener('keydown', handleKeyPress);

    initializeButtons();
    
    manageCalculationThread();
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
import { GameLogic, fetchWordList } from './gameLogic.js';
export function toggleDropdown() {
    var dropdown = document.getElementById("dropdown");
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "block";
    }
}
window.toggleDropdown = toggleDropdown;
document.addEventListener('DOMContentLoaded', async () => {

    const gameModal = document.getElementById('gameModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const continueBtn = document.getElementById('continueBtn');
    const debug = false;
    let keyColours = Array(26).fill(-1);
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
    const colourCodes = ['lightgrey','grey','#C9B458','#6AAA64'];
    let answer = getRandomString(answerlist);
    
    const titleLabel1 = document.getElementById('titleLabel1');
    const gridPane1 = document.getElementById('gridPane1');

    const titleLabe2 = document.getElementById('titleLabel2');
    const gridPane2 = document.getElementById('gridPane2');
    const titleLabel = document.getElementById('titleLabel');
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

    function updateTitleText(newText) {
        titleLabel.textContent = newText;
    }
    


    window.onclick = function(event) {
        if (!event.target.matches('.menu-button')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.style.display === "block") {
                    openDropdown.style.display = "none";
                }
            }
        }
    }

    function manageCalculationThread() {
        updateTitleText("Computer thinking");
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
                computerSolved=lastActivatedRow+1;
            }else{
                updateTitleText("Can you beat the bot?")
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
            bigPool: false,
            randGuess: true
        };
        worker.postMessage(data);
    }

    function activateNextRow() {
        
        if (lastActivatedRow < ROWS - 1 && calculating == false) {
            if(playerSolved || guesslist.includes(characters1[lastActivatedRow+1].join(''))){
                currentColumn = 0;
                lastActivatedRow++;
                updateKeyColors();
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
                        updateTitleText("ha I win!")
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
                    showComputerLetters();
                    if (playerSolved ==computerSolved){showGameModal('tie');}
                    else if (!playerSolved){showGameModal('fail',true)}
                    else {showGameModal('win');}
                } 
            }
        }
    }
    
    function updateColours1(row) {
        clickCounts1[row] = gamelogic.getColours(characters1[row].join(''), answer);
        
       
        for (let col = 0; col < clickCounts1[row].length; col++) {
            buttons1[lastActivatedRow][col].style.color = 'white';
            buttons1[lastActivatedRow][col].style.border = '0px';
            if (clickCounts1[row][col] === 0) {
                buttons1[row][col].style.backgroundColor = colourCodes[1];
            } else if (clickCounts1[row][col] === 1) {
                buttons1[row][col].style.backgroundColor = colourCodes[2];
            } else if (clickCounts1[row][col] === 2) {
                buttons1[row][col].style.backgroundColor = colourCodes[3];
            }
    
        }
    }
    function updateColours2(row) {
        clickCounts2[row] = gamelogic.getColours(characters2[row].join(''), answer);
       
        for (let col = 0; col < clickCounts1[row].length; col++) {
            buttons2[lastActivatedRow][col].style.color = 'white';
            buttons2[lastActivatedRow][col].style.border = '0px';
            if (clickCounts2[row][col] === 0) {
                buttons2[row][col].style.backgroundColor = colourCodes[1];
            } else if (clickCounts2[row][col] === 1) {
                buttons2[row][col].style.backgroundColor = colourCodes[2];
            } else if (clickCounts2[row][col] === 2) {
                buttons2[row][col].style.backgroundColor = colourCodes[3];
            }
        }
    }
    function updateKeyColors(){
        const newKeyColours = Array(26).fill(-1);
        for(let color = 0; color < 3; color++){
            for(let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLUMNS; col++){
                    let letter = characters1[row][col];
                    if (letter.length == 0){break}
                    let tempColour = clickCounts1[row][col] %3;
                    let Keynumber = letter.charCodeAt(0) - 'a'.charCodeAt(0);
                    if(tempColour == color){
                        newKeyColours[Keynumber] = color;
                    }
                }
            }
        }
        for(let i = 0; i<26; i++){
            if (newKeyColours[i] != keyColours[i]){
                keys[i].style.backgroundColor = colourCodes[newKeyColours[i]+1]
                if (newKeyColours[i]==-1){
                    keys[i].style.color = 'black';
                }else{
                    keys[i].style.color = 'white';
                }
            }
        }
        keyColours = [...newKeyColours]
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            activateNextRow();
    
        } else if (event.key === 'Backspace') {
            if (currentColumn === 0) {
                
            } else {
                currentColumn--;
                buttons1[lastActivatedRow + 1][currentColumn].textContent = '';
                buttons1[lastActivatedRow + 1][currentColumn].style.borderColor = 'lightgrey';
            }   
        } else {
            const letter = event.key;
            typeLetter(letter);
        }
    }

    function typeLetter(letter) {
        if (letter.length === 1 && /[a-zA-Z]/.test(letter) && currentColumn < COLUMNS) {
            buttons1[lastActivatedRow + 1][currentColumn].textContent = letter.toUpperCase();
            buttons1[lastActivatedRow + 1][currentColumn].style.borderColor = 'black';
            characters1[lastActivatedRow + 1][currentColumn] = letter.toLowerCase();
            currentColumn++;
        }
    }
    function initializeKeys() {
        // Query all the buttons with the class 'key'
        const keyInfo = document.querySelectorAll('#keyboard-container .key');
        const keys = Array(26).fill(null);
    
        // Iterate over each button
        keyInfo.forEach(button => {
            const keyText = button.textContent.toLowerCase(); // Get the text and normalize it
    
            // Check if the button text is a single letter (ignore special keys)
            if (keyText.length === 1 && /^[a-z]$/.test(keyText)) {
                const index = keyText.charCodeAt(0) - 'a'.charCodeAt(0); // Calculate index (0 for 'a', 1 for 'b', etc.)
                keys[index] = button; // Store the button in the array
            }
        });
    
        
    
        return keys;
    }
    function handleKeyClick(event) {
        const button = event.target; // Get the clicked button element
        const buttonText = button.textContent.trim(); // Get the text of the button
        if (button.className==('key backspace')){
            event.key = 'Backspace'
            handleKeyPress(event)
        }
        if (buttonText=='ENTER'){
            event.key = 'Enter';
            handleKeyPress(event);
        }
        event.key = buttonText
        // Output the text of the clicked button
        typeLetter(buttonText)
    
        // You can use the buttonText variable to perform further actions
        // For example, appending it to a display area or processing it in some way
    }
    
     // Function to show the modal
     function showGameModal(state, disableContinue = false) {
        // Update modal title and message based on the state
        switch(state) {
            case 'fail':
                if (!disableContinue){
                    modalTitle.innerText = 'Epic Fail!';
                    modalMessage.innerText = 'Would you like to try again or continue? (continue to see computers guesses)';
                }
                else{
                    modalMessage.innerText = 'Oh No! Try again?';
                }
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
    document.querySelectorAll('#keyboard-container .key').forEach(button => {
        button.addEventListener('click', handleKeyClick);
    });
    if (debug){updateTitleText(answer)};
    const keys = initializeKeys();
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
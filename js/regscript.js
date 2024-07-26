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
    let keyColours = Array(26).fill(-1);

    const ROWS = 6;
    const COLUMNS = 5;
    let URL = window.location.href;
    URL = URL.slice(0,URL.lastIndexOf('/')); // this is becasue github pages handles file references wierdly
    const answerList = URL +'/assets/possibleAnswers.txt';
    const guessList = URL +'/assets/possibleGuesses.txt';
    const secondGuessesList = URL + '/assets/secondGuesses.txt';
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
    const colourCodes = ['lightgrey','grey','#C9B458','#6AAA64'];

    const titleLabel = document.getElementById('titleLabel');
    const gridPane = document.getElementById('gridPane');


    // Initialize the worker
    
    function initializeButtons() {
        for (let row = 0; row < ROWS; row++) {
            buttons[row] = [];
            for (let col = 0; col < COLUMNS; col++) {
                const button = document.createElement('button');

                button.style.backgroundColor = 'white';
                button.disabled = true;
                gridPane.appendChild(button);
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
                if(characters[lastActivatedRow].join('') == answer){ playerSolved =1+lastActivatedRow;updateColours(lastActivatedRow);}
                for (let col = 0; col < COLUMNS; col++) {
                    buttons[lastActivatedRow][col].disabled = false;
                    buttons[lastActivatedRow][col].style.backgroundColor = 'grey';
                    buttons[lastActivatedRow][col].style.color = 'white';
                    buttons[lastActivatedRow][col].style.border = '0px';
                }
                if (!playerSolved){
                    updateColours(lastActivatedRow);
                    if (lastActivatedRow == ROWS -1 ){
                        showGameModal("You Failed :(",true, "would you like to try again?");
        
                    } 
                    
                    
                } 
                
                else if (playerSolved){
                    updateColours(lastActivatedRow);
                    showGameModal("win",true);
                    
                }
                
                updateKeyColors();
            }
        }
        
        
    }
    
    function updateColours(row) {
        //visually changes the colours
        clickCounts[row] = gamelogic.getColours(characters[row].join(''), answer);
        
        for (let col = 0; col < clickCounts[row].length; col++) {
            if (clickCounts[row][col] === 0) {
                buttons[row][col].style.backgroundColor = colourCodes[1];
            } else if (clickCounts[row][col] === 1) {
                buttons[row][col].style.backgroundColor = colourCodes[2];
            } else if (clickCounts[row][col] === 2) {
                buttons[row][col].style.backgroundColor = colourCodes[3];
            }
    
        }
    }
    function deactivateLastRow() {
        //deactivates the last row, not needed in this script
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
        //handles clicks on the displayed keyboard
        const button = event.target;
        const buttonText = button.textContent.trim();
        if (button.className==('key backspace')){
            event.key = 'Backspace'
            handleKeyPress(event)
        }
        if (buttonText=='ENTER'){
            event.key = 'Enter';
            handleKeyPress(event);
        }
        event.key = buttonText

        typeLetter(buttonText)
    
        
    }
    function updateKeyColors(){
        //changes the colour of the keyboard like the regular 'wordle' game
        const newKeyColours = Array(26).fill(-1);
        for(let color = 0; color < 3; color++){
            for(let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLUMNS; col++){
                    let letter = characters[row][col];
                    if (letter.length == 0){break}
                    let tempColour = clickCounts[row][col] %3;
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
    function showGameModal(state, disableContinue = false,state2 = '') {
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
            default:
                modalTitle.innerText = state;
                modalMessage.innerText = state2;
        }
    
        // Remove or show the "Continue" button based on disableContinue
        if (disableContinue) {
            if (continueBtn.parentElement) {
                continueBtn.parentElement.removeChild(continueBtn); // Remove the button from the DOM
            }
        } else {
            // This was annoying me
            if (!document.getElementById('continueBtn')) {
                
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

    tryAgainBtn.addEventListener('click', () => {
        hideGameModal();
        location.reload();
        console.log("Try Again clicked");
    });

    continueBtn.addEventListener('click', () => {
        hideGameModal();
    });
    
    


    document.addEventListener('keydown', handleKeyPress);
    
    initializeButtons();
    const keys = initializeKeys();
    document.querySelectorAll('#keyboard-container .key').forEach(button => {
        button.addEventListener('click', handleKeyClick);
    });
    gridPane.focus();
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
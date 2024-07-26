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
    console.log("hello");
    const gameModal = document.getElementById('gameModal');
    const modalGif = document.getElementById('modalGif');
    modalGif.style.display = 'block';
    gameModal.style.display = 'block';

    const continueBtn = document.getElementById('continueBtn');
    const ROWS = 6;
    const COLUMNS = 5;
    let URL = window.location.href;
    URL = URL.slice(0,URL.lastIndexOf('/'));    // this is becasue github pages handles file references wierdly
    const answerList = URL +'/assets/possibleAnswers.txt';
    const guessList = URL +'/assets/possibleGuesses.txt';
    const secondGuessesList = URL + '/assets/secondGuesses.txt';
    let keyColours = Array(26).fill(-1);
    let buttons = [];
    let clickCounts = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
    let characters = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(''));
    let lastActivatedRow = -1;
    let currentColumn = 0;
    const answerlist = await fetchWordList(answerList);
    const guesslist = await fetchWordList(guessList);
    const colourCodes = ['lightgrey','grey','#C9B458','#6AAA64'];
    const titleLabel = document.getElementById('titleLabel');
    const gridPane = document.getElementById('gridPane');

    let worker= null; 

    
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
        //initialzes buttons
        for (let row = 0; row < ROWS; row++) {
            buttons[row] = [];
            for (let col = 0; col < COLUMNS; col++) {
                const button = document.createElement('button');
                button.style.backgroundColor = 'white';
                button.disabled = true;
                button.addEventListener('click', () => handleTileClick(button, row, col));
                gridPane.appendChild(button);
                buttons[row][col] = button;
            }
        }
    }

    function updateTitleText(newText) {
        titleLabel.textContent = newText;
    }

    function handleTileClick(button, row, col) {
        //handles clicks on the tiles that changes their colour
        clickCounts[row][col]++;
        updateKeyColors();
        manageCalculationThread();
        switch (clickCounts[row][col] % 3) {
            case 0:
                button.style.backgroundColor = 'grey';
                break;
            case 1:
                button.style.backgroundColor = '#C9B458';
                break;
            case 2:
                button.style.backgroundColor = '#6AAA64';
                break;
        }
    }
    
    window.onclick = function(event) {
        // means you c an click outside of the menu button to disable it.
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
        // calculates the next best guess in a seperate thread
        updateTitleText('Thinking...');
        
        if (worker) {
            worker.terminate();
            worker = null;
            console.log('Worker terminated');
        } 
        worker = new Worker('./js/worker.js', { type: 'module' });
        worker.onmessage = function(event) {
            const result = event.data;
            if (result=='solved'){
                updateTitleText("You did it!!");
            }else{
                updateTitleText("Best guess: "+ result);
            }
        };
        const data = {
            rows: ROWS,
            columns: COLUMNS,
            answerList,
            guessList,
            secondGuessesList,
            characters,
            clickCounts,
            lastActivatedRow,
            bigPool: false,
            randGuess: false,
        };
        worker.postMessage(data);
    }

    function activateNextRow() {
        //activates the next row
        if (lastActivatedRow < ROWS - 1 && currentColumn === COLUMNS) {
            if(guesslist.includes(characters[lastActivatedRow+1].join(''))){
                
                currentColumn = 0;
                lastActivatedRow++;
                for (let col = 0; col < COLUMNS; col++) {
                    buttons[lastActivatedRow][col].disabled = false;
                    buttons[lastActivatedRow][col].style.backgroundColor = 'grey';
                    buttons[lastActivatedRow][col].style.color = 'white';
                    buttons[lastActivatedRow][col].style.border = '0px';
                }
                updateKeyColors();
            }
        }
        
    }
    function updateKeyColors(){
        //updates the keyboard colours like the real wordle game
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
    function deactivateLastRow() {
        // deletes the last row
            if (lastActivatedRow >= 0) {
               
            for (let col = 0; col < COLUMNS; col++) {
                buttons[lastActivatedRow][col].disabled = true;
                buttons[lastActivatedRow][col].style.border = '2px solid lightgrey'
                buttons[lastActivatedRow][col].style.backgroundColor = 'white';
                buttons[lastActivatedRow][col].textContent = '';
                characters[lastActivatedRow][col]= '';
                buttons[lastActivatedRow][col].style.color = 'black';
                clickCounts[lastActivatedRow][col] = 0;
            }
            lastActivatedRow--;
            currentColumn = 0;
            updateKeyColors();
            
        }
    }

    function handleKeyPress(event) {
        //handles key presses
        event.preventDefault();
        if (event.key === 'Enter') {
            activateNextRow();
            manageCalculationThread();
        } else if (event.key === 'Backspace') {
            if (currentColumn === 0) {
                deactivateLastRow();
                manageCalculationThread();
            } else {
                currentColumn--;
                buttons[lastActivatedRow + 1][currentColumn].textContent = '';
                buttons[lastActivatedRow + 1][currentColumn].style.borderColor = 'lightgrey';
            }
        } else {
            const letter = event.key;
            typeLetter(letter);
        }
    }

    function typeLetter(letter) {
        // types letters in the boxes
        if (letter.length === 1 && /[a-zA-Z]/.test(letter) && currentColumn < COLUMNS) {
            buttons[lastActivatedRow + 1][currentColumn].textContent = letter.toUpperCase();
            buttons[lastActivatedRow + 1][currentColumn].style.borderColor = 'black';
            characters[lastActivatedRow + 1][currentColumn] = letter.toLowerCase();
            currentColumn++;
        }
    }
    function initializeKeys() {
        // Query all the 'key' buttons
        const keyInfo = document.querySelectorAll('#keyboard-container .key');
        const keys = Array(26).fill(null);
    
        
        keyInfo.forEach(button => {
            const keyText = button.textContent.toLowerCase(); // Get the text and normalize it
    
            
            if (keyText.length === 1 && /^[a-z]$/.test(keyText)) {
                const index = keyText.charCodeAt(0) - 'a'.charCodeAt(0); // Calculate index (0 for 'a', 1 for 'b', etc.)
                keys[index] = button; 
            }
        });
    
        
    
        return keys;
    }
    
    function handleKeyClick(event) {
        // handles clicks of the keyboard
        event.preventDefault();
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
    document.addEventListener('keydown', handleKeyPress);

    initializeButtons();
    const keys = initializeKeys();
    document.querySelectorAll('#keyboard-container .key').forEach(button => {
        button.addEventListener('click', handleKeyClick);
    });
    continueBtn.addEventListener('click', () => {
        gameModal.style.display = 'none';
        
    });
    manageCalculationThread();
    gridPane.focus();
});

window.onclick = function(event) {
    // disables the dropdown when the window is clicked
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
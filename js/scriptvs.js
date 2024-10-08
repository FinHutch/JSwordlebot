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
    showGameModal('VS mode', false,'Can you beat the bot? Scroll down to see the bots moves, you\'ll have to get lucky!',true);
    const debug = true;
    let keyColours = Array(26).fill(-1);
    const ROWS = 6;
    const COLUMNS = 5;
    let URL = window.location.href;
    URL = URL.slice(0,URL.lastIndexOf('/'));  // this is becasue github pages handles file references wierdly
    const answerList = URL +'/assets/possibleAnswers.txt';
    const guessList = URL +'/assets/possibleGuesses.txt';
    const secondGuessesList = URL + '/assets/secondGuesses.txt';
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
        //disables dropdown when clicked outside of it
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
        //calculates the next best guess on a seperate thread
        updateTitleText("Computer thinking");
        
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
                updateTitleText("beat the bot")
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
        // handles what happens when the next row is activated
        if (lastActivatedRow < ROWS - 1 && calculating == false) {
            if(playerSolved || guesslist.includes(characters1[lastActivatedRow+1].join(''))){
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
                    // make sure this isn't called when the computer is still thinking
                    waitForVariableChange(() => calculating, false).then(() => {
                        currentColumn = COLUMNS;
                        activateNextRow();
                    });
                }
                else if (computerSolved && !playerSolved){
                    if (computerSolved==lastActivatedRow+1){
                        showGameModal('You Failed!',false,'complete the wordle to view comptuers guesses')
                        updateColours1(lastActivatedRow);
                    }
                    else
                    {
                        updateColours1(lastActivatedRow);
                        updateTitleText("Loser!!")
                    }
                }
                else if (computerSolved && playerSolved){
                    showComputerLetters();
                    if (computerSolved==playerSolved){
                    updateTitleText("it's a tie")}
                    else if (computerSolved>playerSolved){
                        showGameModal("You Win!!!", false, "Well done, that's no easy task. Check out the other game modes in the menu.");
                    }else{
                        showGameModal("At least you got it",true, "You got the word... but the computer beat you to it. Try out the other game modes in the menu");
                    }
    
                }
                
                if (lastActivatedRow == ROWS -1 &&calculating == false){
                    //what happens if they get to the last row
                    showComputerLetters();
                    if (playerSolved ==computerSolved){showGameModal('It\'s a tie!',false, 'You both got it on the last guess. Poor from both of you.');}
                    else if (!playerSolved && computerSolved){showGameModal('You failed',false,':( refresh to try again, or check out the other game modes in the menu')}
                    else if(playerSolved && !computerSolved){showGameModal("You win!",false, "Wow! you beat the computer on the lsat guess!");}
                    else {showGameModal("you Lose", false, " you both didn't get the word, but I'm not counting that as a win. The word was " + answer)}
                } 
                updateKeyColors();
            }
        }
        
    }
    
    function updateColours1(row) {
        //handles the visual appearence of the players tile colours
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
        // handles the visual colours of the computers tile colours
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
        // handles the colours of the keys just like the wordle game
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
        //handles key presses
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
        // types a letter in the players grid
        if (letter.length === 1 && /[a-zA-Z]/.test(letter) && currentColumn < COLUMNS) {
            buttons1[lastActivatedRow + 1][currentColumn].textContent = letter.toUpperCase();
            buttons1[lastActivatedRow + 1][currentColumn].style.borderColor = 'black';
            characters1[lastActivatedRow + 1][currentColumn] = letter.toLowerCase();
            currentColumn++;
        }
    }
    function initializeKeys() {
        // Query all the key buttons
        const keyInfo = document.querySelectorAll('#keyboard-container .key');
        const keys = Array(26).fill(null);
    
  
        keyInfo.forEach(button => {
            const keyText = button.textContent.toLowerCase(); 
    

            if (keyText.length === 1 && /^[a-z]$/.test(keyText)) {
                const index = keyText.charCodeAt(0) - 'a'.charCodeAt(0); // Calculate index (0 for 'a', 1 for 'b', etc.)
                keys[index] = button; 
            }
        });
    
        
    
        return keys;
    }
    function handleKeyClick(event) {
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
    
  
     function showGameModal(state, disableContinue = false,state2 = '',disableTryAgain = true) {
      
            modalTitle.innerText = state;
            modalMessage.innerText = state2;
        
    
    
        if (disableTryAgain) {
            if (tryAgainBtn.parentElement) {
                tryAgainBtn.parentElement.removeChild(tryAgainBtn); // Remove the button from the DOM
            }
        } else {
           
            if (!document.getElementById('tryAgainBtn')) {
              
                gameModal.appendChild(tryAgainBtn);
            }
            tryAgainBtn.style.display = 'inline-block'; 
        }
        if (disableContinue) {
            if (continueBtn.parentElement) {
                continueBtn.parentElement.removeChild(continueBtn); 
            }
        } else {
          
            if (!document.getElementById('continueBtn')) {
              
                gameModal.appendChild(continueBtn);
            }
            continueBtn.style.display = 'inline-block'; 
        }
    
 
        gameModal.style.display = 'block';
    }
    
    


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

    

    document.addEventListener('keydown', handleKeyPress);
    
    initializeButtons();
    document.querySelectorAll('#keyboard-container .key').forEach(button => {
        button.addEventListener('click', handleKeyClick);
    });
    if (debug){console.log(answer)};
    const keys = initializeKeys();
    manageCalculationThread();
    gridPane1.focus();
});

function getRandomString(stringList) {
    // this is so the computer on the vs mode doesn't pick the same first guess every time
    if (stringList.length === 0) {
        throw new Error('The list is empty.');
    }

 
    const randomIndex = Math.floor(Math.random() * stringList.length);
    
    return stringList[randomIndex];
}
document.addEventListener('DOMContentLoaded', () => {
    const ROWS = 6;
    const COLUMNS = 5;
    let buttons = [];
    let clickCounts = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
    let characters = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(' '));
    let lastActivatedRow = -1;
    let currentColumn = 0;

    const titleLabel = document.getElementById('titleLabel');
    const gridPane = document.getElementById('gridPane');

    function initializeButtons() {
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
        clickCounts[row][col]++;
        manageCalculationThread();
        switch (clickCounts[row][col] % 3) {
            case 0:
                button.style.backgroundColor = 'grey';
                break;
            case 1:
                button.style.backgroundColor = 'yellow';
                break;
            case 2:
                button.style.backgroundColor = 'green';
                break;
        }
    }

    function manageCalculationThread() {
        updateTitleText('Thinking...');
        // Simulate asynchronous calculation
        setTimeout(() => {
            const result = calculate(characters, clickCounts, lastActivatedRow);
            updateTitleText(result);
        }, 1000);
    }

    function calculate(characters, clickCounts, lastActivatedRow) {
        // Placeholder for game logic calculation
        return 'Calculation Complete';
    }

    function activateNextRow() {
        if (lastActivatedRow < ROWS - 1 && currentColumn === COLUMNS) {
            currentColumn = 0;
            lastActivatedRow++;
            for (let col = 0; col < COLUMNS; col++) {
                buttons[lastActivatedRow][col].disabled = false;
                buttons[lastActivatedRow][col].style.backgroundColor = 'grey';
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
            activateNextRow();
            manageCalculationThread();
        } else if (event.key === 'Backspace') {
            if (currentColumn === 0) {
                deactivateLastRow();
                manageCalculationThread();
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

    document.addEventListener('keydown', handleKeyPress);

    initializeButtons();
    gridPane.focus();
});


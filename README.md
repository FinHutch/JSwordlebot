# JSwordlebot

**JSwordlebot** is a web-based application that features three Wordle-related games:

1. **Regular Wordle**: Play the classic Wordle game directly within your browser. It should also work on mobile devices
2. **Wordle Solver**: Use the bot to assist in solving Wordle puzzles. Input a puzzle, and the bot will suggest the next best guess based on its algorithm.
3. **Head-to-Head**: Challenge the Wordle bot in a competitive game to see who can guess the word faster.

## How It Works

The **Wordle Solver** uses an algorithm to determine the optimal next guess for a given Wordle puzzle. The bot evaluates every possible guess and selects the one that, on average, narrows down the word list the most effectively. 

### Algorithm Overview

- **Strategy**: The algorithm calculates which guess will most efficiently reduce the size of the remaining word list.
- **Performance**: Although the algorithm is pretty good, it is not flawless. While it aims to minimize the average number of remaining guesses, it doesn't always select the optimal guess. The average number of guesses with this approach is approximately **3.44**, compared to **3.42** average guesses for the best solution made by anyone.


## Try it out

- https://finhutch.github.io/JSwordlebot/game2.html

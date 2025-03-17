# Livescore_Scraper
A Node.js command-line tool to scrape football (soccer) fixtures from LiveScore. This script fetches match data, including head-to-head stats, home and away team last matches, and upcoming fixtures for a user-specified date or tomorrow. It saves the scraped data to a Fixtures.json file and logs all output to output.txt for easy reference. Features include interactive date input (YY-MM-DD format), colorized terminal output, and robust error handling. Ideal for football enthusiasts, developers, or anyone interested in match data analysis.


## Installation Guideline

Follow these steps to set up and run the script:

1. **Install Node.js and npm**  
   - **Option 1**: Download and install [Node.js](https://nodejs.org/) (v14 or higher recommended). npm comes bundled with Node.js.  
   - **Option 2**: Install via package manager (e.g., on Ubuntu/Debian):
     ```bash
     sudo apt update && sudo apt install nodejs npm
     ```
     - For macOS with Homebrew:
       ```bash
       brew install node
       ```
   - Verify installation:
     ```bash
     node -v
     npm -v
     ```

2. **Clone the Repository**  
   - Clone this repo to your local machine:
     ```bash
     git clone https://github.com/Qring99/Livescore_Scraper.git
     ```
   - Navigate into the directory:
     ```bash
     cd Livescore_Scraper
     ```

3. **Install Dependencies**  
   - Run the following command to install required packages:
     ```bash
     npm install axios chalk@4.1.2 figlet
     ```
   - This installs `axios`, `chalk` (v4.1.2), and `figlet`, and updates `package.json`.

4. **Verify Setup**  
   - Ensure all dependencies are installed by checking the `node_modules` folder or running:
     ```bash
     npm list --depth=0
     ```
## Contact & Customization
Want to tweak this script for your own needs or extract additional data not currently included? I'd be happy to help! Reach out to me at qring99@gmail.com (mailto:qring99@gmail.com) for custom modifications tailored to your expectations---whether it's adding new features, adjusting the output, or scraping different stats. Let's make it work for

## Hiring Opportunity: 
Passionate about web scraping and automation? I'm eager to showcase my expertise! If you're seeking a skilled professional to architect innovative scraping solutions, streamline workflows, or automate intricate web processes, connect with me at qring99@gmail.com (mailto:qring99@gmail.com). Let's elevate your projects together---hire me, and unlock a world of possibilities!

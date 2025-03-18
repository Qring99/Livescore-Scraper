# Livescore_Scraper
A Node.js command-line tool to scrape football (soccer) fixtures from LiveScore. This script fetches match data, including head-to-head stats, home and away team last matches, and upcoming fixtures for the next match day. It saves the scraped data to Fixtures.json and logs all output to output.txt for easy reference. Features include colorized terminal output, robust error handling, and automated fixture retrieval. The premium version supports custom date selection. Ideal for football enthusiasts, developers, and match data analysts.

## Why This Script Stands Out

By default, this script scrapes all football fixtures for tomorrow from LiveScore, delivering comprehensive match data with fast and efficient execution.

High-Speed Scraping Runs in under 20 minutes, depending on the size of the extracted data.

Real-Time Logging Displays detailed match data with rapid console logging.

Optimized Performance Built for speed and efficiency, ensuring quick data retrieval.

Apify Compatibility Can run on Apify, but due to its high-speed logging, Apify may display a warning:
"WARNING: Logging is too fast, some lines were skipped."

Best Experience on Local Machines For full logs and maximum efficiency, we recommend installing and running the script locally from GitHub.


This script is designed for football analysts, developers, and data enthusiasts who need accurate and timely match data with minimal

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
5. **Run Script**
   - Run the following command to run the script:
     ```bash
     node livescore.js
     ```
## Important Notice for Apify Users:
If you run this tool on Apify, it will execute successfully, but the output file---Fixtures.json and output.txt---will not be saved locally. This is due to how Apify handles file storage. Unlike a traditional local environment, Apify does not support direct file saving using fs.writeFile() or fs.createWriteStream(). Instead, Apify stores output in its Key-Value Store, which requires a different method to access your data.

For the best experience, we highly recommend installing and running this tool on your local machine, where you can properly generate and access Fixtures.json and output.txt.

However, if you choose to run the tool on Apify, you can still view the logs:

1. Go to the Apify Console after the run is complete.


2. Click "View Full Logs" to see how the output was saved in output.txt.



This will help you understand where the output is stored within Apify's environment.

## Install and Run the Script Locally
To use this script, install it on your local machine and run it. If you enjoy the script and find it useful, consider upgrading to the paid version, which includes:

Custom date selection (e.g., 25-08-18)
Upcoming & past fixtures
Head-to-head (H2H) stats
Home & away last matches

For access to the premium version, email me at qring99@gmail.com

## Contact & Customization
Want to tweak this script for your own needs or extract additional data not currently included? I'd be happy to help! Reach out to me at qring99@gmail.com (mailto:qring99@gmail.com) for custom modifications tailored to your expectations---whether it's adding new features, adjusting the output, or scraping different stats. Let's make it work for

## Hiring Opportunity: 
Passionate about web scraping and automation? I'm eager to showcase my expertise! If you're seeking a skilled professional to architect innovative scraping solutions, streamline workflows, or automate intricate web processes, connect with me at qring99@gmail.com (mailto:qring99@gmail.com). Let's elevate your projects together---hire me, and unlock a world of possibilities!

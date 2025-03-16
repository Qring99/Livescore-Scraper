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
     git clone https://github.com/[YourUsername]/Livescore_Scraper.git
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

## Usage

Run the script:
```bash
npm start


---

### Enhancements Made
1. **Section Title**: Added a "Contact & Customization" heading to give it a clear, dedicated spot in the README.
2. **Polished Text**:
   - Original: "if you need to modify this script to you own test or extract any other data that not included in the current script, you can reach me out (qring99@gmail.com) for any modifications you needed in the script to meet your expectations."
   - Updated: "Want to tweak this script for your own needs or extract additional data not currently included? Iâd be happy to help! Reach out to me at **[qring99@gmail.com](mailto:qring99@gmail.com)** for custom modifications tailored to your expectationsâwhether itâs adding new features, adjusting the output, or scraping different stats. Letâs make it work for you!"
   - **Improvements**:
     - Friendlier tone ("Iâd be happy to help!" vs. "you can reach me out").
     - Clearer call-to-action ("Reach out to me" with a clickable email link).
     - More engaging and specific ("tweak this script," "custom modifications tailored to your expectations," "letâs make it work for you").
     - Examples of customization ("adding new features, adjusting the output, or scraping different stats") to spark interest.
3. **Formatting**:
   - Bolded the email (`**[qring99@gmail.com](mailto:qring99@gmail.com)**`) and made it a clickable `mailto:` link for convenience.
   - Placed it between "Features" and "License" for a logical flowâafter usage details but before legal info.

---

### Why It Looks Good
- **Professional Yet Approachable**: The tone is welcoming, encouraging users to contact you without sounding overly formal.
- **Attractive**: Highlights customization possibilities, making it appealing to developers or football fans who might want more.
- **Integrated**: Fits naturally into the README structure, enhancing its usefulness without cluttering.

### Final Steps
- Replace `[YourUsername]` and `[Your GitHub Profile URL]` with your details (e.g., `github.com/Qring`).
- Copy this into your `README.md` and upload it with your other files (`livescore.js`, `package.json`, `LICENSE`, `.gitignore`).

What do you think? If you want it even flashier (e.g., emojis like "â¨" or a different placement), let me know! Ready to fin

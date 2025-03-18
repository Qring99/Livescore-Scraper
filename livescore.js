const axios = require('axios');
const fs = require('fs').promises;
const chalk = require('chalk'); // Using v4.1.2
const figlet = require('figlet');
const path = require('path');

// Helper to determine if running on Apify
function isOnApify() {
    return process.env['APIFY_IS_AT_HOME'] === '1';
}

// Define storage paths
const STORAGE_DIR = './storage';
const KV_STORE_DIR = path.join(STORAGE_DIR, 'key_value_stores', 'default');
const DATASET_DIR = path.join(STORAGE_DIR, 'datasets', 'default');
const FIXTURES_FILE = path.join(KV_STORE_DIR, 'Fixtures.json');
const LOG_FILE = path.join(DATASET_DIR, 'logs.jsonl'); // Using .jsonl for line-separated JSON

// Ensure directories exist
async function ensureDirectories() {
    await fs.mkdir(KV_STORE_DIR, { recursive: true }).catch(() => {});
    await fs.mkdir(DATASET_DIR, { recursive: true }).catch(() => {});
}

// Helper to log to both console and file
async function logToConsoleAndFile(message, color = chalk.white) {
    console.log(color(message));
    const plainMessage = message.replace(/\x1b\[[0-9;]*m/g, ''); // Strip ANSI codes
    await fs.appendFile(LOG_FILE, JSON.stringify({ message: plainMessage }) + '\n');
}

// Date utility functions
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // e.g., "2025-03-18"
}

function formatMatchDate(dateString) {
    if (!dateString || dateString.length < 8) return "unknown";
    const year = dateString.slice(0, 4).slice(-2); // Last 2 digits
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);
    return `${day}.${month}.${year}`; // e.g., "27.10.24"
}

function getTomorrowDate() {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// Main execution function
async function main() {
    await ensureDirectories();

    const tomorrowDate = getTomorrowDate();
    const url = `https://prod-cdn-mev-api.livescore.com/v1/api/app/date/soccer/${tomorrowDate}/0?countryCode=NG&locale=en&MD=1`;

    let urlCount = 0;
    const allUrls = [];
    const fixturesData = {
        "date": getTodayDate(),
        "total_matches_tomorrow": 0,
        "matches": []
    };

    // Display script header
    await logToConsoleAndFile(figlet.textSync('Football Fixtures Scraper by Qring', { font: 'Standard' }), chalk.white.bold);
    await logToConsoleAndFile('=== FOOTBALL FIXTURES SCRAPER ===', chalk.white.bold);

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (!data?.Stages?.length) {
            await logToConsoleAndFile('No stages found in initial response', chalk.red);
            return;
        }

        data.Stages.forEach(stage => {
            const cnmT = stage.CnmT || "unknown";
            const scd = stage.Scd || "unknown";

            if (!stage.Events?.length) return;

            stage.Events.forEach(event => {
                const t1Name = event.T1?.[0]?.Nm || "unknown";
                const t2Name = event.T2?.[0]?.Nm || "unknown";

                if (event.Pids) {
                    Object.keys(event.Pids).forEach(key => {
                        if (key === "8") {
                            const pidsValue = event.Pids[key] || "unknown";
                            const newUrl = `https://www.livescore.com/_next/data/rBZqXyzFUTFIHBhe08WFB/en/football/${cnmT}/${scd}/${t1Name}-vs-${t2Name}/${pidsValue}/h2h.json`;
                            urlCount++;
                            allUrls.push({ url: newUrl, team1: t1Name, team2: t2Name });
                        }
                    });
                }
            });
        });

        await logToConsoleAndFile(`Total Matches Found: ${urlCount}`, chalk.magenta);
        fixturesData.total_matches_tomorrow = urlCount;

        if (!allUrls.length) {
            await logToConsoleAndFile('No Matches Found', chalk.red);
            return;
        }

        const saveFixturesData = async () => {
            try {
                await fs.writeFile(FIXTURES_FILE, JSON.stringify(fixturesData, null, 2));
                await logToConsoleAndFile('Fixtures data updated', chalk.magenta);
            } catch (error) {
                await logToConsoleAndFile(`Error saving Fixtures data: ${error.message}`, chalk.red);
            }
        };

        const processUrl = async (urlIndex) => {
            if (urlIndex >= allUrls.length) {
                await logToConsoleAndFile('All Fixtures processed', chalk.magenta);
                await saveFixturesData(); // Final save
                return;
            }

            const { url: currentUrl, team1, team2 } = allUrls[urlIndex];
            await logToConsoleAndFile(`\nProcessing Fixtures ${urlIndex + 1}: ${team1} vs ${team2}`, chalk.blue);

            try {
                const response = await axios.get(currentUrl);
                const h2hData = response.data;

                const matchData = {};
                let hasData = false;

                const metaParams = h2hData?.pageProps?.layoutContext?.metaParams;
                if (metaParams) {
                    const team1 = metaParams.team1 || "unknown";
                    const team2 = metaParams.team2 || "unknown";
                    matchData.teams = `${team1} vs ${team2}`;
                    await logToConsoleAndFile(`"${team1}" vs "${team2}"`, chalk.cyan);
                } else {
                    matchData.teams = "unknown vs unknown";
                    await logToConsoleAndFile('metaParams not found', chalk.red);
                }

                // Process head-to-head matches
                const headToHead = h2hData?.pageProps?.initialEventData?.event?.headToHead?.h2h;
                if (headToHead?.length) {
                    matchData.h2h = [];
                    let h2hCounter = 1;
                    for (const h2hGroup of headToHead) {
                        if (h2hGroup.events?.length) {
                            hasData = true;
                            for (const event of h2hGroup.events) {
                                const stageName = event.stage?.stageName || "unknown";
                                const homeTeam = event.homeName || "unknown";
                                const awayTeam = event.awayName || "unknown";
                                const homeScore = event.homeScore || "0";
                                const awayScore = event.awayScore || "0";
                                const matchDate = formatMatchDate(event.startDateTimeString);

                                await logToConsoleAndFile(`H2H ${h2hCounter}:`, chalk.white.bold);
                                await logToConsoleAndFile(`Stage Name: ${stageName}`, chalk.green);
                                await logToConsoleAndFile(`Score: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`, chalk.yellow);

                                matchData.h2h.push({
                                    "Score": `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
                                    "Stage Name": stageName,
                                    "date": matchDate
                                });
                                h2hCounter++;
                            }
                        }
                    }
                } else {
                    await logToConsoleAndFile('No H2H data found', chalk.red);
                }

                // Process home last matches
                const homeData = h2hData?.pageProps?.initialEventData?.event?.headToHead?.home;
                if (homeData?.length) {
                    matchData["Home last matches"] = [];
                    await logToConsoleAndFile('\nHome last matches:', chalk.blue);
                    let hlmCounter = 1;
                    for (const homeGroup of homeData) {
                        if (homeGroup.events?.length) {
                            for (const event of homeGroup.events) {
                                const stageName = event.stage?.stageName || "unknown";
                                const homeTeam = event.homeName || "unknown";
                                const awayTeam = event.awayName || "unknown";
                                const homeScore = event.homeScore || "0";
                                const awayScore = event.awayScore || "0";
                                const matchDate = formatMatchDate(event.startDateTimeString);

                                await logToConsoleAndFile(`HLM ${hlmCounter}:`, chalk.white.bold);
                                await logToConsoleAndFile(`Stage Name: ${stageName}`, chalk.green);
                                await logToConsoleAndFile(`Score: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`, chalk.yellow);

                                matchData["Home last matches"].push({
                                    "Score": `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
                                    "Stage Name": stageName,
                                    "date": matchDate
                                });
                                hlmCounter++;
                            }
                            hasData = true;
                        }
                    }
                } else {
                    await logToConsoleAndFile('No Home last matches found', chalk.red);
                }

                // Process away last matches
                const awayData = h2hData?.pageProps?.initialEventData?.event?.headToHead?.away;
                if (awayData?.length) {
                    matchData["Away last matches"] = [];
                    await logToConsoleAndFile('\nAway last matches:', chalk.blue);
                    let almCounter = 1;
                    for (const awayGroup of awayData) {
                        if (awayGroup.events?.length) {
                            for (const event of awayGroup.events) {
                                const stageName = event.stage?.stageName || "unknown";
                                const homeTeam = event.homeName || "unknown";
                                const awayTeam = event.awayName || "unknown";
                                const homeScore = event.homeScore || "0";
                                const awayScore = event.awayScore || "0";
                                const matchDate = formatMatchDate(event.startDateTimeString);

                                await logToConsoleAndFile(`ALM ${almCounter}:`, chalk.white.bold);
                                await logToConsoleAndFile(`Stage Name: ${stageName}`, chalk.green);
                                await logToConsoleAndFile(`Score: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`, chalk.yellow);

                                matchData["Away last matches"].push({
                                    "Score": `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
                                    "Stage Name": stageName,
                                    "date": matchDate
                                });
                                almCounter++;
                            }
                            hasData = true;
                        }
                    }
                } else {
                    await logToConsoleAndFile('No Away last matches found', chalk.red);
                }

                if (hasData) {
                    fixturesData.matches.push(matchData);
                    await saveFixturesData();
                } else {
                    await logToConsoleAndFile('No H2H, Home, or Away data found for this URL', chalk.red);
                }

                await processUrl(urlIndex + 1);
            } catch (error) {
                await logToConsoleAndFile(`Skipping URL ${urlIndex + 1} due to error: ${error.message}`, chalk.red);
                await saveFixturesData(); // Save current state before skipping
                await processUrl(urlIndex + 1);
            }
        };

        await processUrl(0);
    } catch (error) {
        await logToConsoleAndFile(`Error in first API call: ${error.message}`, chalk.red);
    }
}

// Run the script
main().catch(err => {
    console.error(chalk.red(`Main execution failed: ${err.message}`));
    process.exit(1);
});

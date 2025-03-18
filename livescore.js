const Apify = require('apify');
const axios = require('axios');
const chalk = require('chalk'); // Using v4.1.2
const figlet = require('figlet');

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

// Helper function to log to both console and dataset
async function logToConsoleAndDataset(message, logDataset, color = chalk.white) {
    console.log(color(message));
    await logDataset.pushData({ message: message.replace(/\x1b\[[0-9;]*m/g, '') }); // Strip ANSI codes
}

Apify.main(async () => {
    const tomorrowDate = getTomorrowDate();
    const url = `https://prod-cdn-mev-api.livescore.com/v1/api/app/date/soccer/${tomorrowDate}/0?countryCode=NG&locale=en&MD=1`;

    let urlCount = 0;
    const allUrls = [];
    const fixturesData = {
        "date": getTodayDate(),
        "total_matches_tomorrow": 0,
        "matches": []
    };

    // Open Apify storage
    const kvStore = await Apify.openKeyValueStore('football-fixtures');
    const logDataset = await Apify.openDataset('fixture-logs');

    // Display script header
    await logToConsoleAndDataset(figlet.textSync('Football Fixtures Scraper by Qring', { font: 'Standard' }), logDataset, chalk.white.bold);
    await logToConsoleAndDataset('=== FOOTBALL FIXTURES SCRAPER ===', logDataset, chalk.white.bold);

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (!data?.Stages?.length) {
            await logToConsoleAndDataset('No stages found in initial response', logDataset, chalk.red);
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

        await logToConsoleAndDataset(`Total Matches Found: ${urlCount}`, logDataset, chalk.magenta);
        fixturesData.total_matches_tomorrow = urlCount;

        if (!allUrls.length) {
            await logToConsoleAndDataset('No Matches Found', logDataset, chalk.red);
            return;
        }

        const saveFixturesData = async () => {
            try {
                await kvStore.setValue('Fixtures', fixturesData);
                await logToConsoleAndDataset('Fixtures data updated in KeyValueStore', logDataset, chalk.magenta);
            } catch (error) {
                await logToConsoleAndDataset(`Error saving Fixtures data: ${error.message}`, logDataset, chalk.red);
            }
        };

        const processUrl = async (urlIndex) => {
            if (urlIndex >= allUrls.length) {
                await logToConsoleAndDataset('All Fixtures processed', logDataset, chalk.magenta);
                await saveFixturesData(); // Final save
                return;
            }

            const { url: currentUrl, team1, team2 } = allUrls[urlIndex];
            await logToConsoleAndDataset(`\nProcessing Fixtures ${urlIndex + 1}: ${team1} vs ${team2}`, logDataset, chalk.blue);

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
                    await logToConsoleAndDataset(`"${team1}" vs "${team2}"`, logDataset, chalk.cyan);
                } else {
                    matchData.teams = "unknown vs unknown";
                    await logToConsoleAndDataset('metaParams not found', logDataset, chalk.red);
                }

                // Process head-to-head matches
                const headToHead = h2hData?.pageProps?.initialEventData?.event?.headToHead?.h2h;
                if (headToHead?.length) {
                    matchData.h2h = [];
                    let h2hCounter = 1;
                    headToHead.forEach(h2hGroup => {
                        if (h2hGroup.events?.length) {
                            hasData = true;
                            h2hGroup.events.forEach(async (event) => {
                                const stageName = event.stage?.stageName || "unknown";
                                const homeTeam = event.homeName || "unknown";
                                const awayTeam = event.awayName || "unknown";
                                const homeScore = event.homeScore || "0";
                                const awayScore = event.awayScore || "0";
                                const matchDate = formatMatchDate(event.startDateTimeString);

                                await logToConsoleAndDataset(`H2H ${h2hCounter}:`, logDataset, chalk.white.bold);
                                await logToConsoleAndDataset(`Stage Name: ${stageName}`, logDataset, chalk.green);
                                await logToConsoleAndDataset(`Score: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`, logDataset, chalk.yellow);

                                matchData.h2h.push({
                                    "Score": `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
                                    "Stage Name": stageName,
                                    "date": matchDate
                                });
                                h2hCounter++;
                            });
                        }
                    });
                } else {
                    await logToConsoleAndDataset('No H2H data found', logDataset, chalk.red);
                }

                // Process home last matches
                const homeData = h2hData?.pageProps?.initialEventData?.event?.headToHead?.home;
                if (homeData?.length) {
                    matchData["Home last matches"] = [];
                    await logToConsoleAndDataset('\nHome last matches:', logDataset, chalk.blue);
                    let hlmCounter = 1;
                    homeData.forEach(homeGroup => {
                        if (homeGroup.events?.length) {
                            homeGroup.events.forEach(async (event) => {
                                const stageName = event.stage?.stageName || "unknown";
                                const homeTeam = event.homeName || "unknown";
                                const awayTeam = event.awayName || "unknown";
                                const homeScore = event.homeScore || "0";
                                const awayScore = event.awayScore || "0";
                                const matchDate = formatMatchDate(event.startDateTimeString);

                                await logToConsoleAndDataset(`HLM ${hlmCounter}:`, logDataset, chalk.white.bold);
                                await logToConsoleAndDataset(`Stage Name: ${stageName}`, logDataset, chalk.green);
                                await logToConsoleAndDataset(`Score: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`, logDataset, chalk.yellow);

                                matchData["Home last matches"].push({
                                    "Score": `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
                                    "Stage Name": stageName,
                                    "date": matchDate
                                });
                                hlmCounter++;
                            });
                            hasData = true;
                        }
                    });
                } else {
                    await logToConsoleAndDataset('No Home last matches found', logDataset, chalk.red);
                }

                // Process away last matches
                const awayData = h2hData?.pageProps?.initialEventData?.event?.headToHead?.away;
                if (awayData?.length) {
                    matchData["Away last matches"] = [];
                    await logToConsoleAndDataset('\nAway last matches:', logDataset, chalk.blue);
                    let almCounter = 1;
                    awayData.forEach(awayGroup => {
                        if (awayGroup.events?.length) {
                            awayGroup.events.forEach(async (event) => {
                                const stageName = event.stage?.stageName || "unknown";
                                const homeTeam = event.homeName || "unknown";
                                const awayTeam = event.awayName || "unknown";
                                const homeScore = event.homeScore || "0";
                                const awayScore = event.awayScore || "0";
                                const matchDate = formatMatchDate(event.startDateTimeString);

                                await logToConsoleAndDataset(`ALM ${almCounter}:`, logDataset, chalk.white.bold);
                                await logToConsoleAndDataset(`Stage Name: ${stageName}`, logDataset, chalk.green);
                                await logToConsoleAndDataset(`Score: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`, logDataset, chalk.yellow);

                                matchData["Away last matches"].push({
                                    "Score": `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
                                    "Stage Name": stageName,
                                    "date": matchDate
                                });
                                almCounter++;
                            });
                            hasData = true;
                        }
                    });
                } else {
                    await logToConsoleAndDataset('No Away last matches found', logDataset, chalk.red);
                }

                if (hasData) {
                    fixturesData.matches.push(matchData);
                    await saveFixturesData();
                } else {
                    await logToConsoleAndDataset('No H2H, Home, or Away data found for this URL', logDataset, chalk.red);
                }

                await processUrl(urlIndex + 1);
            } catch (error) {
                await logToConsoleAndDataset(`Skipping URL ${urlIndex + 1} due to error: ${error.message}`, logDataset, chalk.red);
                await saveFixturesData(); // Save current state before skipping
                await processUrl(urlIndex + 1);
            }
        };

        await processUrl(0);
    } catch (error) {
        await logToConsoleAndDataset(`Error in first API call: ${error.message}`, logDataset, chalk.red);
    }
});

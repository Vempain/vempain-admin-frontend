const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dayjs = require("dayjs");

function gitFetch() {
    try {
        execSync('git fetch', { stdio: 'inherit' });
    } catch (error) {
        console.error('Error fetching the latest changes from the repository:', error);
        process.exit(1);
    }
}

function getLatestTag() {
    try {
        return execSync('git describe --tags --abbrev=0').toString().trim();
    } catch (error) {
        return null;
    }
}

function getCurrentVersionString(currentVersion, latestTag) {
    const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);

    if (latestTag) {
        const [latestMajor, latestMinor, latestPatch] = latestTag.split('.').map(Number);

        if (currentMajor === latestMajor && currentMinor === latestMinor) {
            return `${currentMajor}.${currentMinor}.${latestPatch}`;
        }
    }

    return `${currentMajor}.${currentMinor}.0`;
}

const versionFilePath = path.resolve(__dirname, 'VERSION');
const currentVersion = fs.readFileSync(versionFilePath, 'utf8').trim();

gitFetch();

const latestTag = getLatestTag();
const nextVersion = getCurrentVersionString(currentVersion, latestTag);

const buildTime = new Date().toISOString();
const buildTimeFormatted = dayjs(buildTime).format("YYYY.MM.DD HH:mm")
const outputFilePath = path.resolve(__dirname, 'src/buildInfo.json');

fs.writeFileSync(outputFilePath, JSON.stringify({ buildTime: buildTimeFormatted, version: nextVersion }), 'utf8');

console.log("==================================================================================");
console.log("Generating build time and version...");
console.log(`Build time: ${buildTimeFormatted}`);
console.log(`Next version: ${nextVersion}`);
console.log("==================================================================================");

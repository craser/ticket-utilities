'use  strict'

const fs = require('fs');
const os = require('os');
const CmdRunner = require("./CmdRunner");

// Admittedly, this is absurdly short. But I'm aiming to just maintain the cache long enough
// that a utility script that's retrieving data for a bunch of tickets, etc, won't accidentally
// fire a zillion requests at the server.
const defaultExpirationMinutes = 1; // long enough to be useful, short enough to not be stale

function getCacheFile(ticketId) {
    let file = `${os.homedir()}/.tickets/${ticketId}.json`;
    return file;
}

function getCachedJson(ticketId) {
    try {
        let file = getCacheFile(ticketId);
        let stats = fs.statSync(file);
        let now = new Date();
        let diff = now - stats.mtime;
        if (diff > defaultExpirationMinutes * 60 * 1000) {
            return null;
        } else {
            let json = fs.readFileSync(file);
            return json.toString();
        }
    } catch (e) {
        return null;
    }
}

function writeCachedJson(ticketId, json) {
    try {
        let file = getCacheFile(ticketId);
        fs.writeFileSync(file, json);
    } catch (e) {
        console.log(e);
    }
}

async function fetchFreshTicketJson(ticket) {
    let url = ticket.getApiUrl();
    let client = ticket.getClient();
    let user = client.getApiUser();
    let token = client.getApiToken();
    let wkd = ticket.getWorkDir();
    let args = [
        '-s',
        '--user',
        `${user}:${token}`,
        url
    ]
    return new CmdRunner(wkd).curl(args);
}

async function fetchTicketJson(ticket) {
    let json = getCachedJson(ticket.getTicketId());
    if (json) {
        return JSON.parse(json);
    } else {
        let json = await fetchFreshTicketJson(ticket);
        writeCachedJson(ticket.getTicketId(), json);
        return JSON.parse(json);
    }
}

module.exports = fetchTicketJson;








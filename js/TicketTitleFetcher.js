#!/usr/bin/env node

'use  strict'

const fs = require('fs');
const os = require('os');
const NodeContext = require('./NodeContext');

function getCacheFile(ticketId) {
    let file = `${os.homedir()}/.tickets/${ticketId}.title`;
    return file;
}

function getCachedTitle(ticketId) {
    try {
        let file = getCacheFile(ticketId);
        let title = fs.readFileSync(file);
        return title.toString().trim();
    } catch (e) {
        return null;
    }
}

function writeCachedTitle(ticketId, title) {
    try {
        let file = getCacheFile(ticketId);
        fs.writeFileSync(file, `${title}`);
    } catch (e) {
        console.log(e);
    }
}

async function getTicketTitle(ticketId) {
    let title = getCachedTitle(ticketId);
    if (title) {
        return title;
    } else {
        let nodeContext = new NodeContext();
        let client = nodeContext.getClientByTicketId(ticketId);
        let ticket = client.getTicket(ticketId);
        let title = await ticket.getTitle();
        writeCachedTitle(ticketId, title.toString());
        return title;
    }

}

module.exports = getTicketTitle;








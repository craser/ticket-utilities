'use strict';

const fetchTicketJson = require('./TicketJsonFetcher');

function Ticket(nodeCtx, client, ticketId) {
    const wkd = nodeCtx.getWorkingDirectory(); // TODO: This MIGHT not match the work dir for this client/ticket

    this.getTicketId = function () {
        return ticketId;
    };

    this.getLink = function () {
        let format = client.getTicketUrlFormat();
        let url = format.replace(/%s/, ticketId);
        return url;
    };

    this.getRepoLink = function () {
        let format = client.getTicketRepoLinkFormat();
        let url = format.replace(/%s/, ticketId);
        return url;
    };

    /**
     * NOTE: This is POORLY NAMED. It returns the Object representation of the ticket JSON.
     * @returns {Promise<Object>}
     */
    this.getTicketJson = function () {
        return fetchTicketJson(this);
    }

    this.getTitle = function () {
        return this.getTicketJson()
            .then(ticket => ticket['fields']['summary'].trim());
    }

    this.getSubTickets = function (filter = () => true) {
        return this.getTicketJson()
            .then(json => json.fields.subtasks)
            .then(subtasks => subtasks.filter(filter))
            .then(subtasks => subtasks.map(st => {
                return new Ticket(nodeCtx, client, st.key);
            }));
    }

    this.getApiUrl = function () {
        let format = client.getApiUrlFormat();
        let url = format.replace(/%s/, ticketId);
        return url;
    }

    this.getWorkDir = function () {
        return wkd; // TODO: Better implementation. See above.
    };

    this.getClient = function () {
        return client;
    }

    this.getBaseRepo = function () {
        return client.getBaseRepo();
    };

    this.getBaseBranch = function () {
        return client.getBaseBranch();
    };

    this.getFullySpecifiedBaseBranch = function () {
        return client.getFullySpecifiedBaseBranch();
    }

    this.getForkRepo = function () {
        return client.getForkRepo();
    }

    this.getBranch = function () {
        return client.formatBranchName(ticketId);
    };

    this.getPrAssignees = function () {
        return client.getPrAssignees();
    };

    this.getPrReviewers = function () {
        return client.getPrReviewers();
    };

    this.getPrLabels = function () {
        return client.getPrLabels();
    }

    this.getTicketResourceDirectory = function () {
        let wkd = nodeCtx.getWorkingDirectory();
        let re = /^(?<basedir>.*\/dev\/[^/]+)\//
        let parsed = wkd.match(re);
        let baseDir = parsed.groups.basedir;
        let resourceDir = `${baseDir}/tickets/${this.getTicketId()}`;
        return resourceDir;
    }
}

module.exports = Ticket;

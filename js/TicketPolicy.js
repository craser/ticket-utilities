
'use  strict'

const NodeContext = require('./NodeContext');

function TicketPolicy() {
    let nodeCtx = new NodeContext();

    /**
     * Hacky re-implementation of Ruby's native string interpolation goodness.
     * example: "ticket_branch_format": "LA_Update-%{number}",
     */
    function formatString(string, vals) {
        var formatted = string.replace(/%\{(\w+)\}/g, function (m, a) {
            return vals[a];
        });
        return formatted;
    }

    function buildBranchPattern(format, prefix) {
        var fragment = formatString(format, {
            id: `(?<prefix>${prefix})-(?<number>\\d+)`,
            number: '(?<number>\\d+)',
            title: ''
        });
        var regex = new RegExp(fragment);
        return regex;
    }

    function getBranchRegexes(client) {
        var format = client['ticket_branch_format'];
        if (format) {
            var prefixList = client['ticket_prefixes'];
            if (prefixList) {
                var prefixes = prefixList.split(/\s+/);
                var patterns = prefixes.map(function (prefix) {
                    return buildBranchPattern(format, prefix);
                });
                return patterns;
            } else {
                var prefix = client['ticket_prefix'];
                var pattern = buildBranchPattern(format, prefix);
                return [pattern];
            }
        } else {
            return [];
        }
    }

    function parseBranch(string, clients) {
        return clients.reduce(function(id, client) {
            if (id) {
                return id;
            } else {
                let regexes = getBranchRegexes(client);
                return regexes.reduce(function (id, regex) {
                    if (id) {
                        return id;
                    } else {
                        let match = string.match(regex);
                        if (match) {
                            var number = match.groups.number;
                            var prefix = match.groups.prefix || client.ticket_prefix;
                            id = `${prefix}-${number}`;
                            return id;
                        } else {
                            return null;
                        }
                    }
                }, null);
            }
        }, null);
    }

    function getDefaultPrefix(wkd, clients) {
        var prefix = null;
        clients.forEach(function (client) {
            var clientName = client['client_name'];
            if (wkd.indexOf(`dev/${clientName}`) > -1) {
                prefix = client['ticket_prefix'];
            }
        });
        return prefix;
    }

    function parseGeneral(string, clients, wkd) {
        if (string.match(/\w+-\d+/)) {
            var ticketId = string.match(/\w+-\d+/)[0];
            return ticketId.toUpperCase();
        } else if (string.match(/\d+/)) {
            var prefix = getDefaultPrefix(wkd, clients);
            var key = string.match(/\d+/)[0];
            return `${prefix}-${key}`;
        } else {
            return string.toUpperCase();
        }
    }

    this.scrubTicketId = function(string) {
        if (!string) {
            return string;
        } else {
            let wkd = nodeCtx.getWorkingDirectory();

            let clients = [nodeCtx.getCurrentClient()].concat(nodeCtx.getClients()).filter(c => c);
            var ticketId = parseBranch(string, clients) || parseGeneral(string, clients, wkd);
            return ticketId;

        }
    };
}

module.exports = TicketPolicy;

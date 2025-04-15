const Ticket = require('./Ticket');
const GitRepo = require('./GitRepo');
const Context = require('./Context');

function Project(nodeCtx, config) {
    let context = parseContext(nodeCtx, config);

    function parseContext(nodeCtx, config) {
        let clientContext = new Context(config);
        try {
            let projectName = nodeCtx.getWorkingDirectory().match('wk/([^/]*)')[1];
            let projects = clientContext.get('projects');
            if (projects && projects[projectName]) {
                return new Context(projects[projectName], clientContext);
            } else {
                return clientContext;
            }
        } catch (e) {
            return clientContext;
        }
    }

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

    function parseTicketId(ticketId) {
        let numMatch = ticketId.match(/\d+/);
        let preMatch = ticketId.match(/\w+/);
        return {
            id: ticketId,
            number: numMatch ? numMatch[0] : '',
            prefix: preMatch ? preMatch[0] : ''
        };
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

    function getBranchRegexes() {
        var format = config['ticket_branch_format'];
        if (format) {
            var prefixList = config['ticket_prefixes'];
            if (prefixList) {
                var prefixes = prefixList.split(/\s+/);
                var patterns = prefixes.map(function (prefix) {
                    return buildBranchPattern(format, prefix);
                });
                return patterns;
            } else {
                var prefix = config['ticket_prefix'];
                var pattern = buildBranchPattern(format, prefix);
                return [pattern];
            }
        } else {
            return null;
        }
    }

    function getTicketIdByBranchName(branch) {
        let regexes = getBranchRegexes();
        let ticketId = regexes.reduce(function (id, regex) {
            if (id) {
                return id;
            } else {
                let match = branch.match(regex);
                if (match) {
                    var number = match.groups.number;
                    var prefix = match.groups.prefix || context.get('ticket_prefix');
                    id = `${prefix}-${number}`;
                    return id;
                } else {
                    return null;
                }
            }
        }, null);
        // This formerly defaulted to branch name - this is not advisable here, since we're looking to return
        // a ticket id. Defaulting to the branch name should be handled in calling code.
        // FIXME: Find the calling code that needed a branch name & update *that* instead.
        return ticketId;
    }

    this.getName = function () {
        return context.get('client_name');
    };

    this.getRepo = function () {
        let wkd = nodeCtx.getWorkingDirectory();
        let repo = new GitRepo(wkd);
        return repo;
    }

    this.getCurrentTicket = function () {
        let repo = this.getRepo();
        return repo.getCurrentBranch()
            .then(branch => getTicketIdByBranchName(branch))
            .then(id => id && new Ticket(nodeCtx, this, id));
    };

    this.getCurrentTicketBranch = function () {
        return this.getRepo().getCurrentBranch();
    }

    this.getCurrentTicketTrackingBranch = function () {
        return this.getRepo().getCurrentTrackingBranch();
    }

    this.formatBranchName = function (ticketId) {
        let format = config.ticket_branch_format;
        if (format) {
            let vals = parseTicketId(ticketId);
            return formatString(format, vals);
        } else {
            return ticketId;
        }
    };

    this.hasTicketPrefix = function (prefix) {
        return config.ticket_prefix == prefix
            || (config.ticket_prefixes && config.ticket_prefixes.indexOf(prefix) > -1);
    }

    this.getBaseRepo = function () {
        return context.get('base_repo');
    }

    this.getBaseBranch = function () {
        return context.get('base_branch');
    };

    this.getFullySpecifiedBaseBranch = function () {
        return this.getFullySpecifiedRemoteBranch(context.get('base_branch'));
    }

    this.getFullySpecifiedRemoteBranch = function(branch) {
        return `${context.get('base_repo')}/${branch}`;
    }

    this.getForkRepo = function () {
        return context.get('fork_repo') || context.get('base_repo');
    }

    this.getTicket = function (ticketId) {
        return new Ticket(nodeCtx, this, ticketId);
    };

    this.getPrAssignees = function () {
        return context.get('pr_assignees');
    };

    this.getPrReviewers = function () {
        return context.get('pr_reviewers');
    };

    this.getPrLabels = function () {
        return context.get('pr_labels');
    }

    this.getTicketUrlFormat = function () {
        return context.get('ticket_url_format');
    }

    this.getTicketRepoLinkFormat = function () {
        return context.get('ticket_repo_link_format');
    }

    this.getApiUrlFormat = function () {
        return context.get('ticket_api_url_format');
    }

    this.getApiUser = function () {
        return context.get('ticket_api_user');
    }

    this.getApiToken = function () {
        return context.get('ticket_api_token');
    }

    this.getCommitArgs = function () {
        return context.get('git.commit_args');
    }

    /**
     * Adding this for backwards compatibility with old client scripts.
     * @DEPRECATED
     * @param propertyName
     * @return {*}
     */
    this.getProperty = function (propertyName) {
        return context.get(propertyName);
    }
}

/**
 * Returns a configuration suitable for use as a stand-in Project
 * when working outside a configured client repo.
 */
Project.getDefaultConfig = function ()  {
    return {
        "client_name": "no client",
        "base_branch": "main",
        "base_repo": "origin",
        "npm_version": "node", // by default, use the latest
        "build_command": "",
        "pr_assignees": [],
        "pr_reviewers": [],
        "pr_labels": [],
        "pull_request_url_format": "",
        "ticket_api_token": "",
        "ticket_api_url_format": "",
        "ticket_api_user": "",
        "ticket_branch_format": "%{id}",
        "ticket_prefix": "",
        "ticket_prefixes": "",
        "ticket_url_format": "no ticket system configured for %s",
        "projects": {}
    };
};

module.exports = Project;

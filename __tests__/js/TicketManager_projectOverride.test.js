'use strict'

jest.mock('fs');
jest.mock('js/CmdRunner');
const fs = require('fs');
const CmdRunner = require('js/CmdRunner');

let CLIENTS = [
    {
        client_name: 'han-solo',
        base_repo: 'solobaserepo',
        base_branch: 'solobasebranch',
        fork_repo: 'soloforkrepo',
        ticket_prefix: 'SOLO',
        ticket_prefixes: 'SOLO',
        ticket_branch_format: 'bugfix/%{number}',
        ticket_url_format: "https://solo-jira/browse/%s",
        ticket_api_url_format: 'solo-url/%s',
        ticket_api_user: 'solo-api-user',
        ticket_api_token: 'solo-api-token',
        pr_assignees: ['pr-assignee'],
        pr_reviewers: ["pr-reviewer"],
        pr_labels: ["pr-label"],
        projects: {
            'bespin': { // override properties for a given repo under [client]/wk/[project]
                base_repo: 'bespinbaserepo',
                base_branch: 'bespinbasebranch',
                fork_repo: 'bespinforkrepo',
                ticket_prefix: 'BSPN',
                ticket_prefixes: 'BSPN',
                ticket_branch_format: 'bespin/%{number}',
                ticket_url_format: "https://bespin-jira/browse/%s",
                ticket_api_url_format: 'bespin-url/%s',
                ticket_api_user: 'bespin-api-user',
                ticket_api_token: 'bespin-api-token',
                branches: {
                    'development': { // override PR settings for a given target branch
                        pr_assignees: ['pr-assignee'],
                        pr_reviewers: ["pr-reviewer"],
                        pr_labels: ["pr-label"]
                    }
                }
            }
        }
    }
];

let CURRENT_REPO_DIRECTORY = 'solo-repo';
let SOLO_BRANCHES = [
    'bugfix/3333'
];
let BESPIN_BRANCHES = [
    'bespin/2222',
];
let CURRENT_BRANCHES = SOLO_BRANCHES;

fs.readFileSync = jest.fn(function(file) {
    if (file.indexOf('clients.js') > -1) {
        return JSON.stringify({ clients: CLIENTS });
    } else if (file.indexOf('.wkd') > -1) {
        return `.../dev/han-solo/wk/${CURRENT_REPO_DIRECTORY}`;
    } else {
        throw new Error(`unmocked file: ${file}`);
    }
});

CmdRunner.prototype.curl = jest.fn(args => {
    return new Promise(resolve => {
        resolve(JSON.stringify({
            fields: {
                summary: 'JIRA_TITLE'
            }
        }));
    });
});

CmdRunner.prototype.git = jest.fn(args => {
    switch (args[0]) {
        case 'branch':
            return new Promise(resolve => {
                resolve({
                    stdout: CURRENT_BRANCHES,
                    stderr: [],
                    code: 0
                });
            });
        case 'config':
            switch (args[2]) {
                case 'remote.solobaserepo.url':
                    return new Promise(resolve => {
                        resolve({
                            stdout: ['git@github.com:solobaseremote/bespin.git'],
                            stderr: [],
                            code: 0
                        });
                    });
                    break;
                case 'remote.soloforkrepo.url':
                    return new Promise(resolve => {
                        resolve({
                            stdout: ['git@github.com:soloforkremote/bespin.git'],
                            stderr: [],
                            code: 0
                        });
                    });
                    break;
                case 'remote.bespinbaserepo.url':
                    return new Promise(resolve => {
                        resolve({
                            stdout: ['git@github.com:bespinbaseremote/bespin.git'],
                            stderr: [],
                            code: 0
                        });
                    });
                    break;
                case 'remote.bespinforkrepo.url':
                    return new Promise(resolve => {
                        resolve({
                            stdout: ['git@github.com:bespinforkremote/bespin.git'],
                            stderr: [],
                            code: 0
                        });
                    });
                default:
                    throw new Error(`unmocked git remote: ${args[2]}`);
            }
            break;
        default:
            throw new Error(`unmocked git call: ${args}`);
    }
});

CmdRunner.prototype.open = jest.fn(args => {
    return new Promise((resolve, reject) => {
        resolve({
            stdout: [],
            stderr: [],
            code: 0
        });
    });
});


const TicketManager = require('js/TicketManager');

test('Should correctly generate a pull command from the base repo', () => {
    CURRENT_REPO_DIRECTORY = 'solo-repo';
    CURRENT_BRANCHES = SOLO_BRANCHES;
    return new TicketManager().getCurrentTicketPullCommand()
        .then(cmd => {
            expect(cmd).toBe('git pull --rebase solobaserepo solobasebranch');
        });
});

test('Should correctly generate a push command to the fork repo', () => {
    CURRENT_REPO_DIRECTORY = 'solo-repo';
    CURRENT_BRANCHES = SOLO_BRANCHES;
    return new TicketManager().getCurrentTicketPushCommand()
        .then(cmd => {
            expect(cmd).toBe('git push soloforkrepo bugfix/3333');
        });
});

test('Should create PR URL from fork repo & branch to base repo & branch', () => {
    CURRENT_REPO_DIRECTORY = 'solo-repo';
    CURRENT_BRANCHES = SOLO_BRANCHES;
    let ticketManager = new TicketManager();
    return ticketManager.openTicketPr('SOLO-1976')
        .then(() => {
            let expected = 'https://github.com/solobaseremote/bespin/compare/solobasebranch...soloforkremote/bugfix/1976?title=SOLO-1976%3A%20JIRA_TITLE&reviewers=pr-reviewer&assignees=pr-assignee&labels=pr-label&expand=1';
            expect(CmdRunner.prototype.open).toHaveBeenLastCalledWith(expected);
        });
});


/**
 * Now test in the bespin working repo
 */

test('Should correctly generate a pull command from the bespin base repo', () => {
    CURRENT_REPO_DIRECTORY = 'bespin';
    CURRENT_BRANCHES = BESPIN_BRANCHES;
    return new TicketManager().getCurrentTicketPullCommand()
        .then(cmd => {
            expect(cmd).toBe('git pull --rebase bespinbaserepo bespinbasebranch');
        });
});

test('Should correctly generate a push command to the bespin fork repo', () => {
    CURRENT_REPO_DIRECTORY = 'bespin';
    CURRENT_BRANCHES = BESPIN_BRANCHES;
    return new TicketManager().getCurrentTicketPushCommand()
        .then(cmd => {
            expect(cmd).toBe('git push bespinforkrepo bespin/2222');
        });
});

test('Should create PR URL from fork repo & branch to bespin base repo & branch', () => {
    CURRENT_REPO_DIRECTORY = 'bespin';
    CURRENT_BRANCHES = BESPIN_BRANCHES;
    let ticketManager = new TicketManager();
    return ticketManager.openTicketPr('SOLO-1976')
        .then(() => {
            let expected = 'https://github.com/bespinbaseremote/bespin/compare/bespinbasebranch...bespinforkremote/bugfix/1976?title=SOLO-1976%3A%20JIRA_TITLE&reviewers=pr-reviewer&assignees=pr-assignee&labels=pr-label&expand=1';
            expect(CmdRunner.prototype.open).toHaveBeenLastCalledWith(expected);
        });
});




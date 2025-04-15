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
    }
];

fs.readFileSync = jest.fn((file) => {
    if (file.indexOf('clients.js') > -1) {
        return JSON.stringify({ clients: CLIENTS });
    } else if (file.indexOf('.wkd') > -1) {
        return '.../dev/han-solo/wk/bespin'
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
            switch (args[1]) {
                case '--show-current':
                    return new Promise(resolve => {
                        resolve({
                            stdout: [
                                'bugfix/3333'
                            ],
                            stderr: [],
                            code: 0
                        });
                    });
                    break;
                default:
                    return new Promise(resolve => {
                        resolve({
                            stdout: [
                                'bugfix/1111',
                                'bugfix/2222',
                                '* bugfix/3333'
                            ],
                            stderr: [],
                            code: 0
                        });
                    });
                    break;
            }
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
    return new TicketManager().getCurrentTicketPullCommand()
        .then(cmd => {
            expect(cmd).toBe('git pull --rebase solobaserepo solobasebranch');
        });
});

test('Should correctly generate a push command to the fork repo', () => {
    return new TicketManager().getCurrentTicketPushCommand()
        .then(cmd => {
            expect(cmd).toBe('git push soloforkrepo bugfix/3333');
        });
});



test('Should create PR URL from fork repo & branch to base repo & branch', () => {
    let ticketManager = new TicketManager();
    return ticketManager.openTicketPr('SOLO-1976')
        .then(() => {
            let expected = 'https://github.com/solobaseremote/bespin/compare/solobasebranch...soloforkremote/bugfix/1976?title=SOLO-1976%3A%20JIRA_TITLE&reviewers=pr-reviewer&assignees=pr-assignee&labels=pr-label&expand=1';
            expect(CmdRunner.prototype.open).toHaveBeenLastCalledWith(expected);
        });
});




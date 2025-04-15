'use strict'

jest.mock('fs');
jest.mock('js/CmdRunner');
const fs = require('fs');
const CmdRunner = require('js/CmdRunner');

let CLIENTS = [
    {
        client_name: 'han-solo',
        base_repo: 'baserepo',
        base_branch: 'basebranch',
        ticket_prefix: 'SOLO',
        ticket_prefixes: 'SOLO',
        ticket_branch_format: 'bugfix/%{number}',
        ticket_url_format: "https://solo-jira/browse/%s",
        pr_assignees: ['pr-assignee'],
        pr_reviewers: ["pr-reviewer"],
        pr_labels: ["pr-label"],
    },
    {
        client_name: 'bantha-pudu',
        base_repo: 'baserepo',
        base_branch: 'basebranch',
        ticket_prefix: 'BNTA',
        ticket_prefixes: 'BNTA',
        ticket_branch_format: 'bugfix/%{number}',
        ticket_url_format: "https://pudu-jira/browse/%s",
        pr_assignees: ['pr-assignee'],
        pr_reviewers: ["pr-reviewer"],
        pr_labels: ["pr-label"],
    }
];

fs.readFileSync = jest.fn((file) => {
    if (file.indexOf('clients.js') > -1) {
        return JSON.stringify({ clients: CLIENTS });
    } else if (file.indexOf('.wkd') > -1) {
        return '~/dev/noclient/wk/bogusrepo'
    } else {
        throw new Error(`unmocked file: ${file}`);
    }
});

CmdRunner.prototype.git = jest.fn(args => {
    switch (args[0]) {
        case 'branch':
            return new Promise(resolve => {
                resolve({
                    stdout: [
                        'bugfix/3333'
                        ],
                    stderr: [],
                    code: 0
                });
            });
        case 'config':
            return new Promise(resolve => {
                resolve({
                    stdout: ['git@github.com:craser/ticket-utilities.git'],
                    stderr: [],
                    code: 0
                });
            });
            break;
        default:
            throw new Error(`unmocked git call: ${args}`);
    }
});


const TicketManager = require('js/TicketManager');

test('Should correctly retrieve bugfix/3333', () => {
    return new TicketManager().getCurrentTicketBranch()
        .then(branch => {
            expect(branch).toBe('bugfix/3333');
        });
});

test('Should correctly retrieve ticket link', () => {
    return new TicketManager().getCurrentTicketLink()
        .then(ticketId => {
            expect(ticketId).toBeNull();
        });
});

test('Should correctly retrieve ticket link', () => {
    return new TicketManager().getCurrentBranchRepoLink()
        .then(ticketId => {
            expect(ticketId).toBeNull();
        });
});

test('Should correctly retrieve ticket link as markdown', () => {
    return new TicketManager().getCurrentTicketLinkAsMarkdown()
        .then(ticketId => {
            expect(ticketId).toBeNull();
        });
});

test('Should correctly retrieve ticket resource directory', () => {
    return new TicketManager().getCurrentTicketResourceDirectory()
        .then(dir => {
            expect(dir).toBe(null);
        });
});

test('Should correctly generate a pull command', () => {
    return new TicketManager().getCurrentTicketPullCommand()
        .then(cmd => {
            expect(cmd).toBe('git pull --rebase origin main');
        });
});

test('Should correctly generate a push command', () => {
    return new TicketManager().getCurrentTicketPushCommand()
        .then(cmd => {
            expect(cmd).toBe('git push origin bugfix/3333');
        });
});

test('Should find a Jira ticket ID in a string', () => {
    let strings = [
        'https://bogus.atlassian.net/browse/JIRA-1234',
        'can you please have a look at JIRA-1234 and let me know what you think?',
        'JIRA-1234 is the ticket number',
        'AA_Poland_JIRA-1234_validations Copy'
    ];
    let ticketManager = new TicketManager();
    let promises = strings.map(s => {
        ticketManager.scrubTicketId(s)
            .then(ticketId => {
                expect(ticketId).toBe('JIRA-1234');
            });
    });
    return Promise.all(promises);
});

test('Should return null when a ticket is not found', () => {
    let strings = [
        'https://bogus.atlassian.net/browse/1234',
        'can you please have a look at JIRA and let me know what you think?',
        'What is the ticket number?'
    ];
    let ticketManager = new TicketManager();
    let promises = strings.map(s => {
        ticketManager.scrubTicketId(s)
            .then(ticketId => {
                expect(ticketId).toBeNull();
            });
    });
    return Promise.all(promises);
});

test('Should uppercase ticket ID', () => {
    let input = 'PDQ-1234';
    let ticketManager = new TicketManager();
    ticketManager.scrubTicketId(input)
        .then(ticketId => {
            expect(ticketId).toBe('PDQ-1234');
        });
});




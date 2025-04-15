'use strict'

jest.mock('fs');
jest.mock('js/CmdRunner');

const TicketManager = require('js/TicketManager');


let CLIENT_SOLO = {
    client_name: 'han-solo',
    base_repo: 'baserepo',
    base_branch: 'basebranch',
    ticket_prefix: 'SOLO',
    ticket_prefixes: 'SOLO',
    ticket_branch_format: 'bugfix/%{number}',
    ticket_api_url_format: 'solo-url/%s',
    ticket_api_user: 'solo-api-user',
    ticket_api_token: 'solo-api-token',
    pr_assignees: ['pr-assignee'],
    pr_reviewers: ["pr-reviewer"],
    pr_labels: ["pr-label"],
};

let CLIENT_PUDU = {
    client_name: 'bantha-pudu',
    base_repo: 'baserepo',
    base_branch: 'basebranch',
    ticket_prefix: 'BNTA',
    ticket_prefixes: 'BNTA',
    ticket_branch_format: 'bugfix/%{number}',
    ticket_api_url_format: 'pudu-url/%s',
    ticket_api_user: 'pudu-api-user',
    ticket_api_token: 'pudu-api-token',
    pr_assignees: ['pr-assignee'],
    pr_reviewers: ["pr-reviewer"],
    pr_labels: ["pr-label"],
};

const fs = require('fs');
fs.readFileSync = jest.fn((path) => {
    if (/clients.json/.test(path)) {
        return JSON.stringify({
            clients: [CLIENT_SOLO, CLIENT_PUDU]
        });
    } else if (/.wkd/.test(path)) {
        return '.../dev/han-solo/wk/falcon';
    }
});

const CmdRunner = require('js/CmdRunner');
CmdRunner.prototype.git = jest.fn(args => {
    return new Promise(resolve => {
        resolve({
            stdout: ['git@github.com:craser/ticket-utilities.git'],
            stderr: [],
            code: 0
        });
    });
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

CmdRunner.prototype.open = jest.fn(args => {
    return new Promise((resolve, reject) => {
        resolve({
            stdout: [],
            stderr: [],
            code: 0
        });
    });
});

test('Should eventually call CmdRunner with correct PR URL', () => {
    let ticketManager = new TicketManager();
    return ticketManager.openTicketPr('SOLO-1976')
        .then(results => {
            expect(CmdRunner.prototype.open).toHaveBeenLastCalledWith('https://github.com/craser/ticket-utilities/compare/basebranch...bugfix/1976?title=SOLO-1976%3A%20JIRA_TITLE&reviewers=pr-reviewer&assignees=pr-assignee&labels=pr-label&expand=1');
        })
        .catch(() => {
            expect(false).toBeTruthy();
        });
});


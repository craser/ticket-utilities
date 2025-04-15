'use strict'

jest.mock('fs');
jest.mock('js/CmdRunner');
const fs = require('fs');
const CmdRunner = require('js/CmdRunner');

let SOLO_WKD = '.../dev/han-solo/wk/falcon';
let PUDU_WKD = '.../dev/bantha-pudu/wk/palace';

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
        git: {
            commit_args: 'han solo flags'
        }
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

const [getWorkingDirectory, setWorkingDirectory] = (function () {
    let wkd = '';
    return [
        function () { return wkd; },
        function (d) { wkd = d; }
    ];
})();

const [getBranches, setBranches] = (function () {
    let branches = [
        'bugfix/1111',
        '* bugfix/2222',
        'bugfix/3333'
    ];
    return [
        function () { return branches; },
        function (b) { branches = b; }
    ];
})();


fs.readFileSync = jest.fn((file) => {
    if (file.indexOf('clients.js') > -1) {
        return JSON.stringify({ clients: CLIENTS });
    } else if (file.indexOf('.wkd') > -1) {
        return getWorkingDirectory();
    } else {
        throw new Error(`unmocked file: ${file}`);
    }
});

CmdRunner.prototype.git = jest.fn(args => {
    switch (args[0]) {
        case 'branch':
            return new Promise(resolve => {
                resolve({
                    stdout: getBranches(),
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

test('Should find git config', () => {
    setWorkingDirectory(SOLO_WKD);
    setBranches(['bugfix/3333', '* refactor.disaster', 'nope']);
    let ticketManager = new TicketManager();
    return ticketManager.getCurrentTicketCommitArgs()
        .then(flags => {
            expect(flags).toEqual('han solo flags')
        });
});

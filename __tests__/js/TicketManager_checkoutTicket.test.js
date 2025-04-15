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
        ticket_branch_format: 'wookiefix/%{id}',
        ticket_url_format: "https://solo-jira/browse/%s",
        pr_assignees: ['pr-assignee'],
        pr_reviewers: ["pr-reviewer"],
        pr_labels: ["pr-label"],
    }
];

fs.readFileSync = jest.fn((file) => {
    if (file.indexOf('clients.js') > -1) {
        return JSON.stringify({ clients: CLIENTS });
    } else if (file.indexOf('.wkd') > -1) {
        return '.../dev/han-solo/wk/falcon'
    } else {
        throw new Error(`unmocked file: ${file}`);
    }
});

CmdRunner.prototype.git = jest.fn(args => {
    switch (args[0]) {
        case 'branch':
            switch (args[1]) {
                case '-r':
                    return new Promise(resolve => {
                        resolve({
                            stdout: ['wookiefix/SOLO-7777'],
                            stderr: [],
                            code: 0
                        });
                    });
                    break;
                default:
                    return new Promise(resolve => {
                        resolve({
                            stdout: [
                                'wookiefix/SOLO-1111',
                                'wookiefix/SOLO-2222',
                                '* wookiefix/SOLO-3333'
                            ],
                            stderr: [],
                            code: 0
                        });
                    });
            }
        case 'config':
            return new Promise(resolve => {
                resolve({
                    stdout: ['git@github.com:craser/ticket-utilities.git'],
                    stderr: [],
                    code: 0
                });
            });
            break;
        case 'ls-files':
            return new Promise(resolve => resolve({
                stdout: [],
                stderr: [],
                code: 0
            }));
            break;
        case 'checkout':
            return new Promise(resolve => resolve({
                stdout: [],
                stderr: [],
                code: 0
            }));
            break;
        default:
            throw new Error(`unmocked git call: ${args}`);
    }
});


const TicketManager = require('js/TicketManager');

test('Should checkout existing local branch', () => {
    let ticketManager = new TicketManager();
    return ticketManager.checkoutTicket('SOLO-1111')
        .then(log => {
            expect(log).toContain('Found local branch: wookiefix/SOLO-1111');
            expect(CmdRunner.prototype.git).toHaveBeenLastCalledWith(['checkout', 'wookiefix/SOLO-1111']);
        });
});

test('Should checkout new local branch', () => {
    let ticketManager = new TicketManager();
    return ticketManager.checkoutTicket('SOLO-5555')
        .then(log => {
            expect(log).toContain("No local branch found for wookiefix/SOLO-5555");
            expect(log).toContain("No remote branch found for SOLO-5555");
            expect(log).toContain("Checking out baserepo/basebranch as wookiefix/SOLO-5555");
            expect(CmdRunner.prototype.git).toHaveBeenLastCalledWith(['checkout', 'baserepo/basebranch', '-b', 'wookiefix/SOLO-5555']);
        });
});

test('Should checkout existing remote branch', () => {
    let ticketManager = new TicketManager();
    return ticketManager.checkoutTicket('SOLO-7777')
        .then(log => {
            expect(log).toContain('Found remote branch: wookiefix/SOLO-7777');
            expect(CmdRunner.prototype.git).toHaveBeenLastCalledWith(['checkout', 'baserepo/wookiefix/SOLO-7777', '-b', 'wookiefix/SOLO-7777']);
        });
});




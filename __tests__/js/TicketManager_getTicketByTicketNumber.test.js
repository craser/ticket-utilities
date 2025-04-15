'use strict'

jest.mock('fs');
jest.mock('js/CmdRunner');

const TicketManager = require('js/TicketManager');


let CLIENT_SOLO = {
    client_name: 'han-solo',
    ticket_prefix: 'SOLO',
    ticket_prefixes: 'SOLO',
    ticket_branch_format: 'bugfix/%{number}'
};

let CLIENT_PUDU = {
    client_name: 'bantha-pudu',
    ticket_prefix: 'BNTA',
    ticket_prefixes: 'BNTA',
    ticket_branch_format: 'bugfix/%{number}'
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



test('Should find client han-solo for SOLO ticket', () => {
    let ticketManager = new TicketManager();
    let soloTicket = ticketManager.getTicketByTicketId('SOLO-1234');
    let puduTicket = ticketManager.getTicketByTicketId('BNTA-4552');
    expect(soloTicket.getTicketId()).toBe('SOLO-1234');
    expect(puduTicket.getTicketId()).toBe('BNTA-4552');
});


'use strict'
const ClientSetup = require('js/ClientSetup');
const NodeContext = require('js/NodeContext');

const child_process = require("child_process");
jest.mock('child_process', () => {
    return {
        spawn: jest.fn(() => {
            return {
                on: jest.fn((event, cb) => {
                    if (event === 'close') {
                        cb(0);
                    }
                }),
                stdout: {
                    on: jest.fn()
                },
                stderr: {
                    on: jest.fn()
                }
            };
        })
    };
});

jest.mock('fs');
const fs = require('fs');
fs.readFileSync = jest.fn((file) => {
    if (file.indexOf('clients.js') > -1) {
        return JSON.stringify({
            clients: [
                { client_name: 'greedo', projects: { kashyyk: {} } },
            ]
        });
    } else if (file.indexOf('.wkd') > -1) {
        return '.../dev/han-solo/wk/falcon'
    } else {
        throw new Error(`unmocked file: ${file}`);
    }
});

fs.writeFileSync = jest.fn(() => {});

jest.mock('os');
const os = require('os');
os.homedir = jest.fn(() => {
    return 'HOME_DIR'
});

beforeEach(() => {
    jest.clearAllMocks();
});

test('Should add a new client config', () => {
    let nodeContext = new NodeContext();
    let clientSetup = new ClientSetup(nodeContext);
    let remote = 'git@github.com:han-solo/bespin.git';
    clientSetup.initClient('han-solo', remote)
        .then(client => {
            // check that we saved to the right file
            let file = fs.writeFileSync.mock.calls[0][0];
            expect(file).toBe(`${nodeContext.getUserHome()}/bin/tickets/clients.json`);

            // check that we saved the right data
            let json = fs.writeFileSync.mock.calls[0][1];
            let clients = JSON.parse(json)['clients'];
            let han = clients.find(c => c.client_name === 'han-solo');
            expect(han).toMatchObject({ client_name: 'han-solo', projects: { bespin: {} } });

            // check that we created the right directories
            expect(child_process.spawn).toHaveBeenCalledTimes(7);
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/dev/han-solo'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/dev/han-solo/wk'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/dev/han-solo/attic'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/dev/han-solo/notes'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/dev/han-solo/tickets'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/bin/client-wk-func'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('env', ['git', 'clone', remote], { cwd: 'HOME_DIR/dev/han-solo/wk' });
        });
});

test('Should create new project in client config', () => {
    let nodeContext = new NodeContext();
    let clientSetup = new ClientSetup(nodeContext);
    let remote = 'git@github.com:greedo/tatooine.git';
    clientSetup.initClient('greedo', remote)
        .then(client => {
            // check that we saved to the right file
            let file = fs.writeFileSync.mock.calls[0][0];
            expect(file).toBe(`${nodeContext.getUserHome()}/bin/tickets/clients.json`);

            // check that we saved the right data
            let json = fs.writeFileSync.mock.calls[0][1];
            let clients = JSON.parse(json)['clients'];
            let greedo = clients.find(c => c.client_name === 'greedo');
            expect(greedo).toMatchObject({ client_name: 'greedo', projects: { tatooine: {}, kashyyk: {} } });

            // check that we created the right directories
            expect(child_process.spawn).toHaveBeenCalledTimes(7);
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/dev/greedo'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/dev/greedo/wk'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/dev/greedo/attic'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/dev/greedo/notes'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/dev/greedo/tickets'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('mkdir', ['-p', 'HOME_DIR/bin/client-wk-func'], { cwd: 'HOME_DIR' });
            expect(child_process.spawn).toHaveBeenCalledWith('env', ['git', 'clone', remote], { cwd: 'HOME_DIR/dev/greedo/wk' });

        });
});

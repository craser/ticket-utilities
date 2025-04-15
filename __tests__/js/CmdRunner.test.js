'use strict'

const CmdRunner = require('js/CmdRunner');
// mock child_process.spawn
jest.mock('child_process', () => {
return {
        spawn: jest.fn(() => {
            return {
                stdout: {
                    on: jest.fn()
                },
                stderr: {
                    on: jest.fn()
                },
                on: jest.fn()
            }
        })
    }
});

// git

// open

// curl


test('placeholder', () => {
    expect(true).toBeTruthy();
});

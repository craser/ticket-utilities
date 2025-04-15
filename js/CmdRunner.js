'use strict';

const { spawn } = require('child_process');
function CmdRunner(wkd) {
    function toLines(output, filter) {
        filter = filter || ((x) => x);
        let lines = output
            .split('\n')
            .map(line => line.trim())
            .map(filter);
        return lines;
    }

    function run (cmd, args) {
        return new Promise(function (resolve, reject) {
            let stdout = '';
            let stderr = '';
            let child = spawn(cmd, args, { cwd: wkd });
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('close', (code) => {
                let results = {
                    stdout: toLines(stdout),
                    stderr: toLines(stderr),
                    code: code
                };
                if (code == 0) {
                    resolve(results);
                } else {
                    console.log('Error running ${cmd}');
                    stderr.map(l => `    ${l}`)
                        .forEach(l => console.log(l));
                    reject(results);
                }
            });
        });
    }

    this.getBinDir = function () {
        let exe = process.argv[1];
        let bin = exe.match(/^(?<bin>.*)\/.*$/).groups.bin;
        return bin;
    }

    this.git = function (args) {
        return run('env', ['git'].concat(args));
    };

    // may god have mercy on my soul...
    this.open = function (url) {
        return run('open', [url]);
    }

    this.curl = function (args) {
        return run('curl', args)
            .then(results => results.stdout.join(''));
    }

    this.mkdir = function (dir) {
        return run('mkdir', ['-p', dir]);
    }
}

module.exports = CmdRunner;

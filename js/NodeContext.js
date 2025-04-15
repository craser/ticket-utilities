'use strict';

const fs = require('fs');
const os = require('os');
const Project = require('./Project');
const GitRepo = require('./GitRepo');

function NodeContext() {
    const userHome = os.homedir();
    const bin = `${userHome}/bin/tickets`; // FIXME: Remove hard-coded path

    function writeClientConfigs(clients) {
        let json = JSON.stringify({ clients: clients });
        fs.writeFileSync(`${bin}/clients.json`, json);
    }

    function readClientConfigs() {
        let json = fs.readFileSync(`${bin}/clients.json`);
        let configs = JSON.parse(json)['clients'];
        return configs;
    }

    this.setClientConfig = function(config) {
        return new Promise((resolve, reject) => {
            let clients = readClientConfigs();
            if (clients.find(c => c.client_name === config.client_name)) {
                clients = clients.map(c => (config.client_name === c.client_name) ? config : c);
            } else {
                clients.push(config);
            }
            writeClientConfigs(clients);
            resolve(config);
        });
    }

    this.getClients = function() {
        let configs = readClientConfigs();
        let clients = configs.map(c => new Project(this, c));
        return clients;
    };

    this.getClientConfigByName = function(name) {
        return new Promise((resolve, reject) => {
            let configs = readClientConfigs();
            let existing = configs.find(c => c.client_name === name);
            let dflt = Project.getDefaultConfig();
            resolve(existing || dflt);
        });
    };

    this.getCurrentClient = function() {
        var wkd = this.getWorkingDirectory();
        var clientName = wkd.replace(/.*\/dev\/([^\/]+).*/, '$1');
        var clients = this.getClients();
        var client = clients.find(c => c.getName() == clientName)
        client = client || new Project(this, Project.getDefaultConfig());
        return client;
    };

    this.getClientByTicketId = function (ticketId) {
        let clients = this.getClients();
        return clients.reduce((a, client) => {
            if (a) {
                return a;
            } else {
                let prefix = ticketId.match(/\w+/)[0];
                if (client.hasTicketPrefix(prefix)) {
                    return client;
                } else {
                    return null;
                }
            }
        }, null);
    };

    /**
     * the current client's git repository
     * @return {string}
     */
    this.getWorkingDirectory = function() {
        var wkd = fs.readFileSync(`${userHome}/.wkd`).toString().trim();
        return wkd;
    };

    /**
     * Current user's home directory.
     * @return {string}
     */
    this.getUserHome = function() {
        return userHome;
    }
}

module.exports = NodeContext;

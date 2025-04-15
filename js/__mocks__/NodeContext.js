const fs = require("fs");
const Project = require('js/Project');

function NodeContext() {
    this.getClients = function() {
        return NodeContext.CONFIG_OBJECT.clients.map(c => new Project(this, c));
    };

    this.getBinDir = function() {
        return NodeContext.CONFIG_OBJECT.binDirectory;
    };

    this.getWorkingDirectory = function() {
        return NodeContext.CONFIG_OBJECT.workingDirectory;
    };

    this.getCurrentClient = function () {
        return new Project(this, NodeContext.CONFIG_OBJECT.currentClient);
    }

    this.shell = function(cmd, f) {

    };
}

NodeContext.CONFIG_OBJECT = {
    workingDirectory: null,
    binDirectory: null,
    currentClient: null,
    clients: []
};
NodeContext.config = function(config) {
    Object.assign(NodeContext.CONFIG_OBJECT, config);
};
NodeContext.resetConfig = function () {
    NodeContext.CONFIG_OBJECT = {};
};
NodeContext.clients = function(clients) {
    CLIENTS = clients;
};
module.exports = NodeContext;

const NodeContext = require("./NodeContext");
const Project = require("./Project");
const CmdRunner = require("./CmdRunner");

class ClientSetup {
    #userDir;

    #getRemoteInfo(remote) {
        let info = {
            name: remote.replace(/.*@.*:([^\/]*).*.git/, '$1'),
            repo: remote.replace(/.*\/([^/]*).git/, '$1'),
            url: remote.replace(/.*@(.*):(.*).git/, 'https://$1/$2')
        };
        return info;
    }

    #createClientDirectories = function (config) {
        let cmd = new CmdRunner(this.#userDir); // FIXME: DO NOT COMMIT TO CODE REPOSITORY!
        let clientName = config.client_name;
        return cmd.mkdir(`${this.#userDir}/dev/${clientName}`)
            .then(() => cmd.mkdir(`${this.#userDir}/dev/${clientName}/wk`))
            .then(() => cmd.mkdir(`${this.#userDir}/dev/${clientName}/attic`))
            .then(() => cmd.mkdir(`${this.#userDir}/dev/${clientName}/notes`))
            .then(() => cmd.mkdir(`${this.#userDir}/dev/${clientName}/tickets`))
            .then(() => cmd.mkdir(`${this.#userDir}/bin/client-wk-func`))
            .then(() => config);
    }

    #cloneGitRepo = function (config, remote) {
        let cmd = new CmdRunner(`${this.#userDir}/dev/${config.client_name}/wk`);
        return cmd.git(['clone', remote])
            .then(() => config);
    }

    constructor(nodeContext) {
        this.#userDir = nodeContext.getUserHome();
    }

    /**
     * Initialize a new client. If the client already exists, then this will
     * add a new project to the client.
     *
     * @param {String} clientName
     * @param {String} gitRemote
     * @return {Promise<client config>} Promise resolves with the new/updated client config obj.
     */
    initClient(clientName, gitRemote) {
        return new NodeContext().getClientConfigByName(clientName)
            .then(config => {
                if (config.client_name != clientName) {
                    config.client_name = clientName;
                }
                let remoteInfo = this.#getRemoteInfo(gitRemote);
                config.projects = config.projects || {};
                if (!config.projects[remoteInfo.repo]) {
                    config.projects[this.#getRemoteInfo(gitRemote).repo] = {};
                }
                return config;
            })
            .then(config => new NodeContext().setClientConfig(config))
            .then(config => this.#createClientDirectories(config))
            .then(config => this.#cloneGitRepo(config, gitRemote));
    }
}

module.exports = ClientSetup


const NodeContext = require('./NodeContext');
const GitRepo = require("./GitRepo");

/**
 * All features implemented here!
 * @constructor
 */
function TicketManager() {
    const nodeContext = new NodeContext();

    /**
     * Do our best to dig a ticket ID out of whatever garbage we're fed.
     *
     * For now, this does the bare minimum: just uses a regeg to find a ticket ID. Returns a
     * Promise that resolves to the ticket ID, or null if no ticket ID is found.
     *
     * POSSIBLE future enhancements:
     *   - Look for a ticket ID in the current branch name
     *   - Look for a ticket ID in the current commit message
     *
     * @param string
     * @return {Promise}
     */
    this.scrubTicketId = function (string) {
        return new Promise(resolve => {
            let re = /(\b|^|[^a-zA-Z])(?<ticket>\w{2,5}-\d{2,5})(\b|^|[^a-zA-Z])/;
            let match = string.match(re);
            if (match) {
                resolve(match.groups.ticket.toUpperCase());
            } else {
                resolve(null);
            }
        });
    }

    this.getCurrentTicket = function () {
        let client = nodeContext.getCurrentClient();
        let currentTicket = client.getCurrentTicket();
        return currentTicket;
    };

    this.getCurrentTicketId = function () {
        return this.getCurrentTicket()
            .then(ticket => ticket.getTicketId());
    }

    this.getTicketByTicketId = function (ticketId) {
        let client = nodeContext.getClientByTicketId(ticketId);
        let ticket = client.getTicket(ticketId);
        return ticket;
    };

    this.getCurrentTicketLink = function () {
        return this.getCurrentTicket()
            .then(ticket => ticket.getLink())
            .catch(() => null);
    };

    this.getCurrentBranchRepoLink = function () {
        return this.getCurrentTicket()
            .then(ticket => ticket.getRepoLink())
            .catch(() => null);
    };

    this.getTicketLinkByTicketId = function (ticketId) {
        return this.getTicketByTicketId(ticketId).getLink();
    };

    this.getCurrentTicketLinkAsMarkdown = function () {
        return this.getCurrentTicket()
            .then(ticket => `[${ticket.getTicketId()}](${ticket.getLink()})`)
            .catch(() => null);
    }

    this.getCurrentTicketBranch = function () {
        return nodeContext.getCurrentClient().getCurrentTicketBranch();
    };

    this.getCurrentTicketResourceDirectory = function () {
        return nodeContext.getCurrentClient().getCurrentTicket()
            .then(ticket => ticket.getTicketResourceDirectory())
            .catch(() => null);
    };

    this.getCurrentTicketPullCommand = function () {
        return new Promise(resolve => {
            let client = nodeContext.getCurrentClient()
            let baseRepo = client.getBaseRepo();
            let baseBranch = client.getBaseBranch();
            let cmd = `git pull --rebase ${baseRepo} ${baseBranch}`;
            resolve(cmd);
        });
    };

    this.getCurrentTicketCommitArgs = function () {
        return new Promise(resolve => {
            let client = nodeContext.getCurrentClient();
            let flags = client.getCommitArgs();
            resolve(flags);
        });
    };

    this.getCurrentTicketPushCommand = function () {
        let client = nodeContext.getCurrentClient();
        return client.getCurrentTicketBranch()
            .then(branch => this.getBranchPushCommand(branch));
    }

    /**
     * This gets funky.
     *   - "pushBranch" is the name of the local branch we want to push.
     *   - "ticketBranch" we retrieve is what the branch should be named in the remote repo.
     *
     * But... why?
     * I want to "squash" my commits into a single commit when I push to the remote repo, but I
     * want to retain the complete record in my local working branch. So I create a squashed branch
     * and want to push *that* to the remote repo, but I want to push it to the remote repo under
     * the proper name of the ticket branch.
     *
     * @param pushBranch
     * @returns {*}
     */
    this.getBranchPushCommand = function (pushBranch) {
        return this.getCurrentTicketBranch()
            .then(ticketBranch => {
                let client = nodeContext.getCurrentClient();
                let repo = client.getForkRepo();
                if (pushBranch == ticketBranch) {
                    return `git push ${repo} ${ticketBranch}`
                } else {
                    return `git push ${repo} ${pushBranch}:${ticketBranch}`
                }
            });
    }

    /**
     * We also sometimes encounter the situation where the remote branch already exists, and
     * doesn't conform to the ticket branch naming convention. In that case, we want to push to
     * the remote TRACKING branch.
     */

    this.getCurrentTicketPushCommandToTrackingBranch = function () {
        let client = nodeContext.getCurrentClient();
        return client.getCurrentTicketBranch()
            .then(branch => this.getPushCommandToTrackingBranch(branch));
    }


    this.getPushCommandToTrackingBranch = function (pushBranch) {
        return this.getCurrentTicketBranch()
            .then(ticketBranch => {
                return nodeContext.getCurrentClient().getCurrentTicketTrackingBranch()
                    .then(trackingBranch => {
                        let trackRegEx = /^(?<repo>\w+)\/(?<branch>.*)$/;
                        let match = null;
                        let track = null;
                        if (match = trackingBranch.match(trackRegEx)) {
                            track = {
                                repo: match.groups.repo,
                                branch: match.groups.branch
                            }
                        }
                        return { ticketBranch, track }
                    })
            })
            .then(({ ticketBranch, track }) => {
                let client = nodeContext.getCurrentClient();
                let repo = client.getForkRepo();
                if (track) {
                    return `git push ${track.repo} ${pushBranch}:${track.branch} #tracking branch`
                } else if (pushBranch == ticketBranch) {
                    return `git push ${repo} ${ticketBranch}`
                } else {
                    return `git push ${repo} ${pushBranch}:${ticketBranch} #bt!=pb`
                }
            });
    }

    this.checkoutTicket = function (string) {
        let nodeCtx = new NodeContext();
        let client = nodeCtx.getCurrentClient();
        let repo = client.getRepo();
        let log = [];

        // check to see if there are uncommitted changes
        return repo.hasUncommittedChanges()
            .then(function (hasChanges) {
                return new Promise(function (resolve, reject) {
                    if (hasChanges) {
                        reject(new Error('Found modified files. Stash or commit & try again.'));
                    } else {
                        resolve();
                    }
                });
            })
            .then(() => {
                return this.scrubTicketId(string);
            })
            .then(function (ticketId) {
                let workBranch = client.getTicket(ticketId).getBranch();
                return workBranch;
            })
            .then(function (workBranch) {
                return repo.getLocalBranches()
                    .then(localBranches => {
                        return { localBranches: localBranches, workBranch: workBranch };
                    });
            })
            .then(function (branchInfo) {
                let localBranches = branchInfo.localBranches;
                let workBranch = branchInfo.workBranch;
                if (localBranches.indexOf(workBranch) > -1) {
                    log.push(`Found local branch: ${workBranch}`);
                    return { base: workBranch, work: workBranch };
                } else {
                    log.push(`No local branch found for ${workBranch}`);
                    return repo.getRemoteBranches()
                        .then(function (remoteBranches) {
                            let remoteBranch = remoteBranches.find(branch => branch.indexOf(string) > -1);
                            if (remoteBranch) {
                                log.push(`Found remote branch: ${remoteBranch}`);
                                let fullRemote = client.getFullySpecifiedRemoteBranch(remoteBranch);
                                return { base: fullRemote, work: workBranch }
                            } else {
                                let baseBranchFull = client.getFullySpecifiedBaseBranch();
                                log.push(`No remote branch found for ${string}`);
                                log.push(`Checking out ${baseBranchFull} as ${workBranch}`);
                                return { base: baseBranchFull, work: workBranch };
                            }
                        });
                }
            })
            .then(function (branchInfo) {
                return repo.checkout(branchInfo.base, branchInfo.work);
            })
            .then(results => {
                results.stdout.forEach(line => log.push(line));
                return log;
            })
            .catch(function (error) {
                console.log(error.toString());
            });
    };

    this.openTicketPr = function (ticketId) {
        let nodeContext = new NodeContext();
        if (ticketId) {
            let client = nodeContext.getClientByTicketId(ticketId);
            let ticket = client.getTicket(ticketId)
            let repo = client.getRepo();
            return repo.openTicketPr(ticket)
                .catch(results => {
                    console.log(results);
                });
        } else {
            let client = nodeContext.getCurrentClient();
            client.getCurrentTicket()
                .then(ticket => {
                    let repo = client.getRepo();
                    return repo.openTicketPr(ticket)
                        .catch(results => {
                            console.log(results);
                        });
                });
        }
    };
}

module.exports = TicketManager;


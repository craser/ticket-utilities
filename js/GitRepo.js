const CmdRunner = require('./CmdRunner');

function GitRepo(wkd) {
    const cmd = new CmdRunner(wkd);

    function git(args) {
        return cmd.git(args);
    }

    function cleanBranchLine(branchLine) {
        return branchLine.replace(/^\*\s*/, '');
    }

    function filterBlanks(line) {
        return '' != line;
    }

    function getLocalBranches(...args) {
        return git(['branch', ...args]);
    }

    function getRemoteBranches() {
        return git(['branch', '-r']);
    }

    function getChangedFiles() {
        return git(['ls-files', '-m']);
    }

    function getRemoteInfo(remote) {
        return git(['config', '--get', `remote.${remote}.url`])
            .then((results) => {
                let raw = results.stdout[0];
                let info = {
                    name: raw.replace(/.*@.*:([^\/]*).*.git/, '$1'),
                    url: raw.replace(/.*@(.*):(.*).git/, 'https://$1/$2')
                };
                return info;
            });
    }

    this.checkout = function (baseBranch, workBranch) {
        if (!workBranch) {
            return git(['checkout', baseBranch]);
        } else if (baseBranch == workBranch) {
            return git(['checkout', baseBranch]);
        } else {
            return git(['checkout', baseBranch, '-b', workBranch]);
        }
    };

    this.getCurrentBranch = function () {
        return getLocalBranches('--show-current')
            .then((results) => {
                let branch = results.stdout[0];
                return branch;
            })
    };

    this.getCurrentTrackingBranch = function () {
        return this.getCurrentBranch()
            .then(branch => git(['rev-parse', '--abbrev-ref', `${branch}@{upstream}`]))
            .then(results => results.stdout[0]);
    }

    this.getCurrentBranchInfo = function (...fields) {
        let format = fields.map(f => `%(${f})`).join('|');
        return this.getCurrentBranch()
            .then(branch => getLocalBranches(`--points-at=${branch}`, `--format=${format}`))
            .then((results) => {
                return results.stdout
                    .map(cleanBranchLine)
                    .filter(filterBlanks)
            });
    }

    this.getLocalBranchInfo = function (sort, ...fields) {
        let format = fields.map(f => `%(${f})`).join('|');
        return getLocalBranches(`--sort=${sort}`, `--format=${format}`)
            .then((results) => {
                return results.stdout
                    .map(cleanBranchLine)
                    .filter(filterBlanks);
            });
    }

    this.getLocalBranches = function () {
        return getLocalBranches()
            .then((results) => {
                return results.stdout
                    .map(cleanBranchLine)
                    .filter(filterBlanks);
            });
    };

    this.getRemoteBranches = function () {
        return getRemoteBranches()
            .then((results) => {
                return results.stdout
                    .map(cleanBranchLine)
                    .filter(filterBlanks);
            });
    }

    this.hasUncommittedChanges = function () {
        const IGNORE = [
            'spc.css',
            'spc.css.map',
            'spc.min.css',
            'bootstrap.css',
            'bootstrap.css.map',
            'bootstrap.min.css',
            'style.css',
            'style.css.map',
            'style.ie.css',
            'style.min.css',
            'app.min.js',
            'bootstrap.bundle.min.js',
            'cartridge/static/default'
        ];

        return getChangedFiles()
            .then((results) => {
                return results.stdout
                    .map(cleanBranchLine)
                    .filter(filterBlanks);
            })
            .then((files) => {
                let re = new RegExp(`(${IGNORE.join('|')})`);
                let changed = files.filter(f => ~re.test(f));
                return changed.length > 0;
            });
    };

    this.openTicketPr = function (ticket) {
        function getPrParams(ticket, data) {
            var assignees = (ticket.getPrAssignees() || [])
                .map(encodeURIComponent)
                .join(',');

            var reviewers = (ticket.getPrReviewers() || [])
                .map(encodeURIComponent)
                .join(',');

            var labels = (ticket.getPrLabels() || [])
                .map(encodeURIComponent)
                .join(',');

            var params = [
                `title=${encodeURIComponent(data.title)}`,
                `reviewers=${reviewers}`, // non-documented, doesn't seem to work in current github version
                `assignees=${assignees}`,
                `labels=${labels}`,
                `expand=1` // skips compare page & goes straight to PR entry form
            ].join('&');

            return params;
        }

        return getRemoteInfo(ticket.getBaseRepo())
            .then(info => {
                return {
                    baseRepoName: info.name,
                    baseRepoUrl: info.url
                };
            })
            .then(data => {
                return getRemoteInfo(ticket.getForkRepo())
                    .then(info => {
                        return Object.assign(data, {
                            forkRepoName: info.name,
                            forRepoUrl: info.url
                        });
                    });
            })
            .then(data => {
                return ticket.getTitle()
                    .then(title => {
                        return Object.assign(data, {
                            title: `${ticket.getTicketId()}: ${title}`
                        });
                    });
            })
            .then((data) => {
                let baseBranch = ticket.getBaseBranch();
                let devBranch = ticket.getBranch();
                let forkRepoName = data.forkRepoName == data.baseRepoName ? '' : `${data.forkRepoName}/`;
                let prParams = getPrParams(ticket, data);
                var url = `${data.baseRepoUrl}/compare/${baseBranch}...${forkRepoName}${devBranch}?${prParams}`
                return cmd.open(url);
            });
    };

};

module.exports = GitRepo;

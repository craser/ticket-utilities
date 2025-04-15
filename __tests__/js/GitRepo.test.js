const GitRepo = require('js/GitRepo');
jest.mock('js/CmdRunner');
const CmdRunner = require('js/CmdRunner');

test('Correctly retrieve local branches from git', () => {
    let git = jest.fn(() => {
        return new Promise((resolve) => {
            resolve({
                stdout: ['derp', 'blim', 'grep'],
                stderr: [],
                code: 0
            });
        });
    });
    CmdRunner.prototype.git = git;

    let repo = new GitRepo('');
    return repo.getLocalBranches()
        .then((branches) => {
            expect(git).toHaveBeenCalledWith(['branch']);
            expect(branches).toStrictEqual(['derp', 'blim', 'grep']);
        });
});

test('Correctly retrieve remote branches from git', () => {
    let git = jest.fn(() => {
        return new Promise((resolve) => {
            resolve({
                stdout: ['* derp', 'blim', 'grep'],
                stderr: [],
                code: 0
            });
        });
    });
    CmdRunner.prototype.git = git;

    let repo = new GitRepo('');
    return repo.getRemoteBranches()
        .then((branches) => {
            expect(git).toHaveBeenCalledWith(['branch', '-r']);
            expect(branches).toStrictEqual(['derp', 'blim', 'grep']);
        });
});

test('Correctly retrieve current branch from git', () => {
    let git = jest.fn(() => {
        return new Promise((resolve) => {
            resolve({
                stdout: ['derp'],
                stderr: [],
                code: 0
            });
        });
    });
    CmdRunner.prototype.git = git;

    let repo = new GitRepo('');
    return repo.getCurrentBranch()
        .then((branch) => {
            expect(git).toHaveBeenCalledWith(['branch', '--show-current']);
            expect(branch).toBe('derp');
        });
});

test('Should check out branch', () => {
    let git = jest.fn(() => {
        return new Promise((resolve) => {
            resolve({
                stdout: [],
                stderr: [],
                code: 0
            });
        });
    });
    CmdRunner.prototype.git = git;

    let repo = new GitRepo('');
    return repo.checkout('THX-1138')
        .then(() => {
            expect(git).toHaveBeenCalledWith(['checkout', 'THX-1138']);
        });
});

test('Should check out to recognize that base branch is the same as checkout', () => {
    let git = jest.fn(() => {
        return new Promise((resolve) => {
            resolve({
                stdout: [],
                stderr: [],
                code: 0
            });
        });
    });
    CmdRunner.prototype.git = git;

    let repo = new GitRepo('');
    return repo.checkout('THX-1138', 'THX-1138') // pass the same branch twice
        .then(() => {
            expect(git).toHaveBeenLastCalledWith(['checkout', 'THX-1138']);
        });
});

test('Should check out to recognize that base branch is NOT the same as checkout', () => {
    let git = jest.fn(() => {
        return new Promise((resolve) => {
            resolve({
                stdout: [],
                stderr: [],
                code: 0
            });
        });
    });
    CmdRunner.prototype.git = git;

    let repo = new GitRepo('');
    return repo.checkout('origin/THX-1138', 'THX-1138') // pass the same branch twice
        .then(() => {
            expect(git).toHaveBeenLastCalledWith(['checkout', 'origin/THX-1138', '-b', 'THX-1138']);
        });
});

test('Should check out to recognize that base branch is NOT the same as checkout', () => {
    let git = jest.fn(() => {
        return new Promise((resolve) => {
            resolve({
                stdout: [],
                stderr: [],
                code: 0
            });
        });
    });
    CmdRunner.prototype.git = git;

    let repo = new GitRepo('');
    return repo.checkout('origin/THX-1138', 'THX-1138') // pass the same branch twice
        .then(() => {
            expect(git).toHaveBeenLastCalledWith(['checkout', 'origin/THX-1138', '-b', 'THX-1138']);
        });
});

test('Should detect uncomitted changes', () => {
    let git = jest.fn(() => {
        return new Promise((resolve) => {
            resolve({
                stdout: ['a', 'b', 'c'],
                stderr: [],
                code: 0
            });
        });
    });
    CmdRunner.prototype.git = git;

    let repo = new GitRepo('');
    return repo.hasUncommittedChanges()
        .then(changed => {
            expect(git).toHaveBeenCalledWith(['ls-files', '-m'])
            expect(changed).toBeTruthy();
        });

});
test('Should detect NO uncomitted changes', () => {
    let git = jest.fn(() => {
        return new Promise((resolve) => {
            resolve({
                stdout: [],
                stderr: [],
                code: 0
            });
        });
    });
    CmdRunner.prototype.git = git;

    let repo = new GitRepo('');
    return repo.hasUncommittedChanges()
        .then(changed => {
            expect(git).toHaveBeenCalledWith(['ls-files', '-m']);
            expect(changed).toBeFalsy();
        });

});

// TODO: openTicketPr
test('Should correctly compile & open URL for new PR', () => {
    // Mock out required calls in CmdRunner
    function mockCmdFunction(stdout, stderr, code) {
        return jest.fn(function () {
            return new Promise(resolve => {
                resolve({
                    stdout: stdout || [],
                    stderr: stderr || [],
                    code: code || 0
                })
            });
        });
    }
    CmdRunner.prototype.getJiraTitle = mockCmdFunction(['Air Force Ranger']);
    CmdRunner.prototype.open = mockCmdFunction();
    CmdRunner.prototype.git = jest.fn((args) => {
        return new Promise((resolve, reject) => {
            let cmd = args[0];
            switch (cmd) {
                case 'config': // base & fork repo same
                    resolve({ stdout: ['git@github.com:craser/ticket-utilities.git'] });
                default:
                    reject(new Error(`unexpected git command: ${cmd}`));
            }
        });
    });

    // Create mock ticket
    let ticket = {
        getTicketId: () => 'THX-1138',
        getPrAssignees: () => ['assignee1', 'assignee2'],
        getPrReviewers: () => ['reviewer1'],
        getPrLabels: () => ['label1', 'label2'],
        getBaseRepo: () => 'BASE_REPO',
        getForkRepo: () => 'BASE_REPO',
        getBaseBranch: () => 'BASE_BRANCH',
        getBranch: () => 'WORK_BRANCH',
        getTitle: () => new Promise(r => r('JIRA_TITLE'))
    };

    let repo = new GitRepo('');
    return repo.openTicketPr(ticket)
        .then(() => {
            expect(CmdRunner.prototype.open).toHaveBeenLastCalledWith('https://github.com/craser/ticket-utilities/compare/BASE_BRANCH...WORK_BRANCH?title=THX-1138%3A%20JIRA_TITLE&reviewers=reviewer1&assignees=assignee1,assignee2&labels=label1,label2&expand=1');
        });
});





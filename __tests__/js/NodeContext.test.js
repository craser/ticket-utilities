'use strict'

jest.mock('fs');
const fs = require('fs');

let CLIENTS = [
    {
        client_name: 'han-solo',
        base_repo: 'baserepo',
        base_branch: 'basebranch',
        ticket_prefix: 'SOLO',
        ticket_prefixes: 'SOLO',
        ticket_branch_format: 'bugfix/%{number}',
        ticket_url_format: "https://solo-jira/browse/%s",
        pr_assignees: ['pr-assignee'],
        pr_reviewers: ["pr-reviewer"],
        pr_labels: ["pr-label"],
    },
    {
        client_name: 'bantha-pudu',
        base_repo: 'baserepo',
        base_branch: 'basebranch',
        ticket_prefix: 'BNTA',
        ticket_prefixes: 'BNTA',
        ticket_branch_format: 'bugfix/%{number}',
        ticket_url_format: "https://pudu-jira/browse/%s",
        pr_assignees: ['pr-assignee'],
        pr_reviewers: ["pr-reviewer"],
        pr_labels: ["pr-label"],
    }
];

fs.readFileSync = jest.fn((file) => {
    if (file.indexOf('clients.js') > -1) {
        return JSON.stringify({ clients: CLIENTS });
    } else if (file.indexOf('.wkd') > -1) {
        return '/no/dev/directory';
    } else {
        throw new Error(`unmocked file: ${file}`);
    }
});

const NodeContext = require('js/NodeContext');
const Project = require('js/Project');

test('Should return default project properties when directory is not recognized', () => {
    const propertyName = 'npm_version';
    let nodeContext = new NodeContext();
    let client = nodeContext.getCurrentClient();
    let propertyValue = client.getProperty(propertyName);
    let defaultValue = Project.getDefaultConfig()[propertyName];
    expect(propertyValue).toBe(defaultValue);
});

test('Should support nested properties', () => {
    const propertyName = 'git.commit_args';
    let nodeContext = new NodeContext();
    let client  = nodeContext.getCurrentClient();
    let propertyValue = client.getProperty(propertyName);

})

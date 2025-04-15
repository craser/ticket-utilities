# Ticket Utilities

## WARNING: A key utility (`tk-set-wkd`) is MISSING here.

These utilities have been around for more than a decade in one form or another, and evolved from a very quick & 
dirty set of bash scripts. And they've only ever been used by me, so there's 100% an aspect of "this works on my 
machine, but YMMV" going on here. I'd like to share these with the world, if only as inspiration to others to 
automate their own workflows, and I have a _little_ time on my hands at the moment, so I'm going to get these 
cleaned up & ready for others to clone & use.

For now, there are a couple of assumptions baked in that most likely make these scripts unusable as-is. 

  - All your git repos are in directories named like: `~/dev/[client]/wk/[project]`
  - `~/.wkd` contains the path to your current repo, and you keep this updated as you move between repos.

## Overview 
In the course of my job, I work with different clients' branching/merging processes, PR policies, Jira processes, 
etc. It's _extremely_ helpful to have a standard set of keyboard shortcuts/macros that help me ensure that I'm 
always honoring how the client prefers to work. This includes:

  - branch naming conventions
  - commit message conventions
  - PR policies (who should be added as a reviewer, which branch should the PR target, etc)

In addition, having a standard set of [TextExpander](https://textexpander.com/) snippets for information around what 
I'm working on is just _insanely_ helpful when clearing up confusion, giving status updates, etc. (Those snippets 
are included in the repo! See: [Tickets.textexpander](./Tickets.textexpander))

Those include:

| snippet | expansion                         |
|--------|-----------------------------------|
| tkx    | name of current workspace ticket  |
| tbx    | name of current workspace branch  |
| tlx    | url of current ticket             |
| tktx   | title of current ticket           |

Plus, there's a _ton_ of snippets for translating a copied ticket ID into its full title from the ticket system, etc.

Bottom line: more clarity, less cognitive load, fewer typos, more getting things done.

## Background

These evolved from a set of bash scripts I wrote long, long ago. I migrated everything (_almost_ everything?) to JS 
a few years back to make it easier to manage config, and to pull in JSON data from Jira.

Until now (04/15/2025) this repo has been private, so I've squashed everything into a single, sanitized commit so as 
not to accidentally leak any private info.


# TODO

- Add `tk-set-wkd` utility. 
  - These scripts rely on my `~/.wkd` file, which contains the path to my current workspace. 

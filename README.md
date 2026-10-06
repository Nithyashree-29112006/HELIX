# HELIX

HELIX is a documentation-only project for practicing the Git and GitHub workflow in a software engineering assignment.

## Workflow goals

- Track README changes with `git diff`, commits, and `git log`.
- Develop and merge a small improvement through a feature branch.
- Link a GitHub Issue to the change that resolves it.
- Create and manually resolve a merge conflict with a second contributor.

## Quick start

```sh
git clone https://github.com/Nithyashree-29112006/HELIX.git
cd HELIX
git status
git log --oneline
```

## Feature branch workflow

Create a branch, make and review a README change, then commit and publish the branch:

```sh
git switch -c docs/my-change
git diff
git add README.md
git commit -m "Describe the change"
git push -u origin docs/my-change
```

Changes made on GitHub can be synchronized to your local clone with `git pull origin main`.

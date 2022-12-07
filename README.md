# Test Coverage Reporter

A github action that generates a comprehensive unit test coverage, including optional coverage diff with the branch the PR
will merge into.

```
- name: Generate report
  uses: jgillick/test-coverage-reporter@main
  with:
    coverage-file: coverage/coverage-final.json
    base-coverage-file: main-branch/coverage/coverage-final.json
    access-token: ${{ secrets.GITHUB_TOKEN }}
```

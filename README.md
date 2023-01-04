# Wait for deployment GitHub Action

This action blocks until a deployment is ready for your push, and outputs its
URL so that you can run tests and other checks against a live site without
running it in Actions.

This has only been tested with [Vercel](https://vercel.com) and Heroku, but it only uses
the GitHub Deployments API, so in theory it will work with any platform that
creates deployments on each push.

## Setup

```yml
name: Test
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: jonico/wait-for-deployment-action@v3
        id: deployment
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          environment: Preview

      - run: echo "Deployed to: ${{ steps.deployment.outputs.url }}"
```

Heroku Review Apps example:

```yml
# wait until preview environment is ready
- name: Wait for preview env to be ready
  uses: jonico/wait-for-deployment-action@v3
  id: deployment
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    environment: your-heroku-app-prefix-${{ github.event.pull_request.number }}
    timeout: 60
    interval: 3
    # pass head sha of current PR to action
    sha: ${{ github.event.pull_request.head.sha }}
```

## Inputs

### `github-token`
This is your GitHub access token, typically accessible via `${{ secrets.GITHUB_TOKEN }}`.

### `environment`
This is the deployment environment to target. The Vercel integration deploys
every push to the `Preview` environment, and pushes to the default branch to
`Production`.

### `timeout`
The number of seconds after which to give up with an error. Default: 30.

### `interval`
The number of seconds to wait between polls to the deployments API. Default: 5.

### `sha`
The SHA of the deployment, without a value, it will be set to the head SHA of the branch for a branch build and the merge commit for a PR build.
In case you like to build the PR branch head in a PR build (Heroku) - try `${{ github.event.pull_request.head.sha }}`

## Outputs

### `url`
The target URL of the deployment, if found.

### `id`
The id of the deployment.
const core = require('@actions/core')
const github = require('@actions/github')

const options = {
  token: core.getInput('github-token'),
  environment: core.getInput('environment'),
  timeout: core.getInput('timeout'),
  interval: core.getInput('interval'),
  shaOption: core.getInput('sha')
}

waitForDeployment(options)
  .then(res => {
    core.setOutput('id', res.deployment.id)
    core.setOutput('url', res.url)
  })
  .catch(error => {
    core.setFailed(error.message)
  })

async function waitForDeployment (options) {
  const {
    token,
    interval,
    environment,
    shaOption
  } = options

  const timeout = parseInt(options.timeout) || 30
 
  var sha = github.context.sha;
  if (shaOption != "branch-head") {
    sha = shaOption;
  }
  
  const octokit = github.getOctokit(token)
  const start = Date.now()

  const params = {
    ...github.context.repo,
    environment,
    sha
  }

  core.info(`Deployment params: ${JSON.stringify(params, null, 2)}`)
  // throw new Error('DERP')

  while (true) {
    const { data: deployments } = await octokit.repos.listDeployments(params)
    core.info(`Found ${deployments.length} deployments...`)

    for (const deployment of deployments) {
      core.info(`\tgetting statuses for deployment ${deployment.id}...`)

      const { data: statuses } = await octokit.request('GET /repos/:owner/:repo/deployments/:deployment/statuses', {
        ...github.context.repo,
        deployment: deployment.id
      })

      core.info(`\tfound ${statuses.length} statuses`)

      const [success] = statuses
        .filter(status => status.state === 'success')
      if (success) {
        core.info(`\tsuccess! ${JSON.stringify(success, null, 2)}`)
        let url = success.target_url
        const { payload = {} } = deployment
        if (payload.web_url) {
          url = payload.web_url
        }
        return {
          deployment,
          status: success,
          url
        }
      } else {
        core.info(`No statuses with state === "success": "${statuses.map(status => status.state).join('", "')}"`)
      }

      await sleep(interval)
    }

    const elapsed = (Date.now() - start) / 1000
    if (elapsed >= timeout) {
      throw new Error(`Timing out after ${timeout} seconds (${elapsed} elapsed)`)
    }
  }
}

function sleep (seconds) {
  const ms = parseInt(seconds) * 1000 || 1
  return new Promise(resolve => setTimeout(resolve, ms))
}

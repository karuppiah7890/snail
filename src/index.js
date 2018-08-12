const shell = require('shelljs')
const chalk = require('chalk')
const pLimit = require('p-limit')
const _ = require('lodash')
var UI = require('cliui')

const execute = (command, commandID, debug = false) => {
  return new Promise((resolve) => {
    console.log(chalk.yellow('\nStarted running: '), chalk.blueBright(command))

    const child = shell.exec(command, { silent: true }, (exitCode, stdout, stderr) => {
      resolve({
        command,
        exitCode,
        stdout,
        stderr
      })
    })

    if (debug) {
      child.stdout.on('data', function (data) {
        // handling multi-line output from commands
        const dataLines = data.split('\n')
        dataLines.forEach((dataLine) => {
          console.log(`${chalk.yellow(`${commandID}: `)}`, dataLine)
        })
      })
    }
  })
}

const executeAll = async (commands, numberOfParallelCommands, debug = false) => {
  try {
    console.log(chalk.yellow('The complete output of all the commands will be shown after running them all'))

    if (debug) {
      console.log(chalk.yellow('\n***Running in DEBUG mode. Commands will be given an ID and the output of the parallely running\n commands will be shown in an interleaved manner while they are executing, with their command ID prefixed***'))

      console.log(chalk.yellow('\n***Running the following commands***'))

      const commandsTableUI = UI({
        width: 40
      })

      commandsTableUI.div(
        { text: chalk.yellow('CommandID') },
        { text: chalk.yellow('Command') }
      )

      commands.forEach((command, commandID) => {
        commandsTableUI.div(
          { text: chalk.yellow(commandID) },
          { text: chalk.blueBright(command) }
        )
      })

      console.log(chalk.yellow(commandsTableUI.toString()))
    }

    const limit = pLimit(numberOfParallelCommands)
    const commandsToRunInParallel = commands.map((command, commandID) => limit(() => execute(command, commandID, debug)))

    const results = await Promise.all(commandsToRunInParallel)
    console.log('\nOutput of the commands:\n')
    results.forEach(result => {
      console.log(chalk.yellow('Result of running the below command:'))
      console.log(`$ ${chalk.blueBright(result.command)}\n`)

      if (result.exitCode !== 0) {
        console.log(chalk.red(`It failed with exit code ${result.exitCode}\n`))
      } else {
        console.log(chalk.green(`It ran successfully with no errors! :D\n`))
      }

      const { stdout, stderr } = result
      if (!_.isEmpty(_.trim(stdout))) {
        console.log(chalk.green(`Stdout:`))
        console.log(stdout)
      }

      if (!_.isEmpty(_.trim(stderr))) {
        console.log(chalk.red(`Stderr:`))
        console.log(stderr)
      }
    })
  } catch (error) {
    console.log(chalk.red('An error occurred while running the commands in parallel: \n'), error)
    console.log(chalk.blueBright('\n\nThe next set of commands will still continue to run! :D'))
  }
}

module.exports = {
  executeAll
}

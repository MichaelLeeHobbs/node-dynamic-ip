const DynamicIPManager = require('./DynamicIPManager')
const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')

const getOptions = (yargs) => {
    yargs
        .positional('config', {describe: 'Path to JSON Config', type: 'string'})
}

console.log(process.argv)

yargs(hideBin(process.argv))
    .command(
        'monitor <config>', 'Start Node Dynamic IP service using config.json',
        getOptions,
        ({config}) => {
            const dynamicIPManager = new DynamicIPManager(config)
            dynamicIPManager.start()
        })
    .demandCommand()
    .help('h')
    .alias('h', 'help')
    .argv

const fs = require('fs')
const path = require('path')
const util = require('util')
const jsYaml = require('js-yaml')
const { Template } = require('../lib/template')

const main = async() => {
    const document = jsYaml.load(fs.readFileSync(path.join(__dirname, 'analyzer.yaml')).toString())
    const template = new Template(document)

    console.log(util.inspect(await template.run({}), { depth: Infinity, colors: true }))
    console.log(util.inspect(await template.run({ responseHeaders: { 'access-control-allow-origin': '*', 'access-control-allow-credentials': 'true' } }), { depth: Infinity, colors: true }))
}

main().catch(console.error)

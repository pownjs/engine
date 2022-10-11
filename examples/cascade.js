const fs = require('fs')
const path = require('path')
const util = require('util')
const jsYaml = require('js-yaml')
const { Template } = require('../lib/template')

const main = async() => {
    const document = jsYaml.load(fs.readFileSync(path.join(__dirname, 'cascade.yaml')).toString())
    const template = new Template(document)

    console.log(util.inspect(await template.run({ ip0: 'test' }), { depth: Infinity, colors: true }))
}

main().catch(console.error)

const fs = require('fs')
const path = require('path')
const jsYaml = require('js-yaml')
const { Template } = require('../lib/template')

const main = async() => {
    const document = jsYaml.load(fs.readFileSync(path.join(__dirname, 'cascade.yaml')).toString())
    const template = new Template(document)

    console.log(await template.run({ ip0: 'test' }))
}

main().catch(console.error)

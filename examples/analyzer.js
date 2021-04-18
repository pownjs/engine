const fs = require('fs')
const path = require('path')
const jsYaml = require('js-yaml')
const { Template } = require('../lib/template')

const main = async() => {
    const document = jsYaml.load(fs.readFileSync(path.join(__dirname, 'analyzer-permissive-cors.yaml')).toString())
    const template = new Template(document)

    console.log(await template.run({}))
    console.log(await template.run({ responseHeaders: { 'access-control-allow-origin': '*', 'access-control-allow-credentials': 'true' } }))
}

main().catch(console.error)

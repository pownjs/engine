const fs = require('fs')
const path = require('path')
const jsYaml = require('js-yaml')
const { createSimpleTemplateHandler } = require('../lib/template')

const { EngineTemplate } = createSimpleTemplateHandler({
    requests: {},

    screenshots: {}
})

const main = async() => {
    const document = jsYaml.load(fs.readFileSync(path.join(__dirname, 'workflow.yaml')).toString())
    const template = new EngineTemplate(document)

    console.log(await template.run())
}

main().catch(console.error)

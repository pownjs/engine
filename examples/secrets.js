const fs = require('fs')
const path = require('path')
const jsYaml = require('js-yaml')
const { createSimpleTemplateHandler } = require('../lib/template')

const { EngineTemplate } = createSimpleTemplateHandler({
    analyzer: {}
})

const main = async() => {
    const document = jsYaml.load(fs.readFileSync(path.join(__dirname, 'secrets-aws.yaml')).toString())
    const template = new EngineTemplate(document)

    console.log(await template.run(''))
    console.log(await template.run('AKIAJE56YT5SVRUGH5OA'))
}

main().catch(console.error)

const fs = require('fs')
const path = require('path')
const jsYaml = require('js-yaml')
const { Template } = require('../lib/template')

class WorkflowTemplate extends Template {
    async * runTaskSetIt(taskName, tasks, input = {}) {
        if (['op', 'ops', 'operation', 'operations'].includes(taskName)) {
            for (let task of tasks) {
                yield* this.runTaskDefinitionsIt(task, input)
            }
        }
        else {
            yield* super.runTaskSetIt(taskName, tasks, input)
        }
    }
}

const main = async() => {
    const document = jsYaml.load(fs.readFileSync(path.join(__dirname, 'workflow.yaml')).toString())
    const template = new WorkflowTemplate(document)

    console.log(await template.run())
}

main().catch(console.error)

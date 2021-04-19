const { ensureArray } = require('./util')
const { Template } = require('./template')

const createSuperTemplate = (definition) => {
    const map = {}

    Object.entries(definition).forEach(([name, handler]) => {
        if (typeof(handler) === 'function') {
            map[name] = { name, run: handler }
        }
        else {
            map[name] = { name, run: handler.run || handler.handler }
        }

        [].concat(ensureArray(handler.alias), ensureArray(handler.aliases)).forEach((alias) => {
            map[alias] = { name, run: handler.run || handler.handler }
        })
    })

    return class extends Template {
        async executeTask(taskName, task, input = {}) {
            const taskDefinition = map[taskName]

            if (!taskDefinition) {
                throw new Error(`Unrecognized task ${taskName}`)
            }

            return taskDefinition.run(task, input)
        }

        async runTask(taskName, task, input = {}) {
            const taskDefinition = map[taskName]

            if (!taskDefinition) {
                throw new Error(`Unrecognized task ${taskName}`)
            }

            taskName = taskDefinition.name

            return super.runTask(taskName, task, input)
        }

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
}

module.exports = { createSuperTemplate }

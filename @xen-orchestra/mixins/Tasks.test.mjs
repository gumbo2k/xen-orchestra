import { strict as assert } from 'assert'
import { Task } from '@vates/task'
import { test } from 'test'
import mixin from '@xen-orchestra/mixin'

import Hooks from './Hooks.mjs'
import Tasks from './Tasks.mjs'

class App {
  constructor() {
    mixin(this, { Hooks, Tasks }, [])
  }
}

test(async function (t) {
  const app = new App()

  assert((await app.tasks.create({ name: 'foo' })) instanceof Task)
})

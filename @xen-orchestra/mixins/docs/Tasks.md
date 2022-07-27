## API

```js
import mixin from '@xen-orchestra/mixin'
import Tasks from '@xen-orchestra/mixins/Tasks.mjs'

class App {
  constructor() {
    mixin(this, { Tasks })
  }
}
const app = new App()

const task = app.tasks.create({ name })

const task = await app.tasks.get(id)

await app.tasks.abort(id)

const runningTasks = await arrayFromAsync(app.tasks.running())
const finishedTasks = await arrayFromAsync(app.tasks.finished())
```

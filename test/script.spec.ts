import { mockBundleAndRun } from './utils'

test('named exports', async () => {
  const { _exports } = await mockBundleAndRun({
    entry: 'named-exports.vue',
  })
  expect(_exports.default.name).toBe('named-exports')
  expect(_exports.foo()).toBe(1)
})

test('experimental <script setup>', async () => {
  await mockBundleAndRun({ entry: 'ScriptSetup.vue' })
})

test('should handle custom resource query', async () => {
  const { _exports } = await mockBundleAndRun({
    entry: 'custom-query.vue',
  })

  expect(_exports.default.data().msg).toBe('Hello from Component A!')
})

test('should support importing external types', async () => {
  const { _exports, window } = await mockBundleAndRun({
    entry: 'imported-types.vue',
  })
  expect(_exports.default).toMatchObject({
    props: {
      msg: {
        type: window.String,
        required: true,
      },
      id: {
        type: window.Number,
        required: false,
      },
    },
  })
})

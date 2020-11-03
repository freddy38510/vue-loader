import { SourceMapConsumer } from 'source-map'
import { fs as mfs } from 'memfs'
import { bundle, mockBundleAndRun, normalizeNewline, genId } from './utils'

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

test('support chaining with other loaders', async () => {
  const { componentModule } = await mockBundleAndRun({
    entry: 'basic.vue',
    modify: (config) => {
      config!.module!.rules[0] = {
        test: /\.vue$/,
        use: ['vue-loader', require.resolve('./mock-loaders/js')],
      }
    },
  })

  expect(componentModule.data().msg).toBe('Changed!')
})

test.skip('inherit queries on files', async () => {
  const { componentModule } = await mockBundleAndRun({
    entry: 'basic.vue?change',
    modify: (config) => {
      config!.module!.rules[0] = {
        test: /\.vue$/,
        use: ['vue-loader', require.resolve('./mock-loaders/query')],
      }
    },
  })

  expect(componentModule.data().msg).toBe('Changed!')
})

test('expose file path as __file outside production', async () => {
  const { componentModule } = await mockBundleAndRun({
    entry: 'basic.vue',
  })

  expect(componentModule.__file).toBe('test/fixtures/basic.vue')
})

test('no __file in production when exposeFilename disabled', async () => {
  const { componentModule } = await mockBundleAndRun({
    mode: 'production',
    entry: 'basic.vue',
  })

  expect(componentModule.__file).toBe(undefined)
})

test('expose file basename as __file in production when exposeFilename enabled', async () => {
  const { componentModule } = await mockBundleAndRun({
    mode: 'production',
    entry: 'basic.vue',
    vue: {
      exposeFilename: true,
    },
  })
  expect(componentModule.__file).toBe('basic.vue')
})

test.skip('source map', async () => {
  const { code } = await bundle({
    entry: 'basic.vue',
    devtool: 'source-map',
  })
  const map = mfs.readFileSync('/test.build.js.map', 'utf-8')
  const smc = new SourceMapConsumer(JSON.parse(map as string))
  let line = 0
  let col = 0
  const targetRE = /^\s+msg: 'Hello from Component A!'/
  code.split(/\r?\n/g).some((l, i) => {
    if (targetRE.test(l)) {
      line = i + 1
      col = 0
      return true
    }
  })
  const pos = smc.originalPositionFor({
    line: line,
    column: col,
  })
  expect(pos.source.indexOf('basic.vue') > -1)
  expect(pos.line).toBe(9)
})

test('extract CSS', async () => {
  await bundle({
    entry: 'extract-css.vue',
    modify: (config: any) => {
      config.module.rules = [
        {
          test: /\.vue$/,
          use: 'vue-loader',
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.stylus$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'stylus-loader'],
        },
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'test.output.css',
      }),
    ],
  })

  const css = normalizeNewline(mfs.readFileSync('/test.output.css').toString())
  const id = `data-v-${genId('extract-css.vue')}`
  expect(css).toContain(`h1 {\n  color: #f00;\n}`)
  // extract + scoped
  expect(css).toContain(`h2[${id}] {\n  color: green;\n}`)
})

// #1464
test('extract CSS with code spliting', async () => {
  await bundle({
    entry: 'extract-css-chunks.vue',
    modify: (config: any) => {
      config.module.rules = [
        {
          test: /\.vue$/,
          use: 'vue-loader',
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'test.output.css',
      }),
    ],
  })

  const css = normalizeNewline(mfs.readFileSync('/test.output.css').toString())
  expect(css).toContain(`h1 {\n  color: red;\n}`)
  expect(mfs.existsSync('/empty.test.output.css')).toBe(false)
  expect(mfs.existsSync('/basic.test.output.css')).toBe(true)
})

test.todo('support rules with oneOf')

test.todo('should work with eslint loader')

test.todo('multiple rule definitions')
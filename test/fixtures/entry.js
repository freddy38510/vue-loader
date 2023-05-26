import { createApp } from 'vue'

import Component from '~target'
import * as _exports from '~target'

if (typeof window !== 'undefined') {
  window.componentModule = Component
  window.exports = _exports

  const app = createApp(Component)
  const container = window.document.createElement('div')
  container.id = 'app'
  window.instance = app.mount(container)
  window.document.body.appendChild(container)
}

export default Component

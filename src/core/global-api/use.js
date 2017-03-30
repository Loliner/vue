/* @flow */

import { toArray } from '../util/index'

// 初始化插件注册方法
export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    /* istanbul ignore if */
    if (plugin.installed) {
      return
    }
    // additional parameters
    // 先将plugin自身从参数列表中移出
    const args = toArray(arguments, 1)

    // 然后将Vue实例prepend进参数头部
    args.unshift(this)

    // 最终传入plugin的参数就会带上Vue实例，以及调用use传进来的参数
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    plugin.installed = true
    return this
  }
}

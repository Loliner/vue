/* @flow */

// config中已有默认配置
import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import builtInComponents from '../components/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

// 初始化Vue的全局调用接口
// 此处的 Vue: GlobalAPI 为泛型，指定参数Vue 必须传入GlobalAPI类型（typescript）
// 如果传入类型不符合，则其在编译成标准es语句时会报错
export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  // 非开发模式vue会提示所有非合法的调用方式，所以建议开发的时候一定要在开发模式下进行
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // Object.create(null) 和 new Object() 的不同之处在于
  // Object.create(null) 会创建一个真空的 {} 对象，连原型都没有
  // 而 new Object() 则会创建一个拥有原型的 空对象
  Vue.options = Object.create(null)

  // 为Vue.options新增 components / directives / filters 对象
  config._assetTypes.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue
  // 给 components 扩展 KeepAlive:Object 属性
  extend(Vue.options.components, builtInComponents)

  initUse(Vue)
  initMixin(Vue)
  initExtend(Vue)
  initAssetRegisters(Vue)
}

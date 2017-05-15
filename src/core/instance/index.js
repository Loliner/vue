import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

// 为 Vue 实例绑定 _init 方法
initMixin(Vue)

// 为 Vue 实例绑定 $data / $props / $set / $delete / $watch 方法
stateMixin(Vue)

// 为 Vue 实例声明 $on / $once / $off / $emit 方法
eventsMixin(Vue)

// 为 Vue 实例声明 _update / $forceUpdate / $destroy 方法
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue

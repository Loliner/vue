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

// 为 Vue 构造函数的原型绑定 _init 方法
initMixin(Vue)

// 为 Vue 构造函数的原型绑定 $data / $props / $set / $delete / $watch 方法
stateMixin(Vue)

// 为 Vue 构造函数的原型声明 $on / $once / $off / $emit 方法
eventsMixin(Vue)

// 为 Vue 构造函数的原型声明 _update / $forceUpdate / $destroy 方法
lifecycleMixin(Vue)

// 为 Vue 构造函数的原型声明 $nextTick / _render，以及 render 函数中用到的如 _s，_c 等方法
renderMixin(Vue)

export default Vue

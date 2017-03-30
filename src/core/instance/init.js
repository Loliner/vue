/* @flow */

import config from '../config'
import { perf } from '../util/perf'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { initInjections } from './inject'
import { initLifecycle, callHook } from './lifecycle'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && perf) {
      perf.mark('init')
    }

    const vm: Component = this
    // a uid
    vm._uid = uid++
    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.

      // 如果只是组件，则 vm.$options = options + vm.constructor.options
      // vm.$options 不仅拥有外部传入的 options 中的属性
      // 也拥有 vm.constructor.options 中的默认属性
      initInternalComponent(vm, options)
    } else {
      // 如果不是组件，则 vm.$options = options + vm.ctor.options + vm.ctor.super.options + vm.ctor.super.super.options ...
      // 不仅拥有外部传入的 options 中的属性，
      // 也拥有 vm 以及 vm 父辈类的 options 属性
      // 但这样处理的原因是为什么呢？跟 Vue 实例继承有关吗？
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm

    // vm的生命周期相关变量初始化
    initLifecycle(vm)

    // vm的事件监听初始化
    initEvents(vm)

    // render & mount
    initRender(vm)
    callHook(vm, 'beforeCreate')

    // vm的状态初始化，prop/data/computed/method/watch都在这里完成初始化，因此也是Vue实例create的关键一步
    initState(vm)
    initInjections(vm)
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && perf) {
      vm._name = formatComponentName(vm, false)
      perf.mark('init end')
      perf.measure(`${vm._name} init`, 'init', 'init end')
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

function initInternalComponent (vm: Component, options: InternalComponentOptions) {

  // 通过 Object.create 创建出来的 vm.$options 的 prototype 为 vm.constructor.options
  const opts = vm.$options = Object.create(vm.constructor.options)

  // 这样做比 for in 快多了
  // doing this because it's faster than dynamic enumeration.
  opts.parent = options.parent
  opts.propsData = options.propsData
  opts._parentVnode = options._parentVnode
  opts._parentListeners = options._parentListeners
  opts._renderChildren = options._renderChildren
  opts._componentTag = options._componentTag
  opts._parentElm = options._parentElm
  opts._refElm = options._refElm
  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    // 获取父类的 options 对象
    const superOptions = resolveConstructorOptions(Ctor.super)
    // 获取自己的 options 对象
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {

    // 如果发现同键不同值的情况，则利用 dedupe 进行深一层挖掘
    // 将 sealed[key] 中没有，但 latest[]key] 中有的键值对挖出来，放到 modified中
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = dedupe(latest[key], sealed[key])
    }
  }
  return modified
}

// 这是在干嘛？
// 代码逻辑是把 sealed中没有，而latest中有的给找出来
function dedupe (latest, sealed) {
  // compare latest and sealed to ensure lifecycle hooks won't be duplicated
  // between merges
  if (Array.isArray(latest)) {
    const res = []
    sealed = Array.isArray(sealed) ? sealed : [sealed]
    for (let i = 0; i < latest.length; i++) {
      if (sealed.indexOf(latest[i]) < 0) {
        res.push(latest[i])
      }
    }
    return res
  } else {
    return latest
  }
}

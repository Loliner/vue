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
    } else 
      // 1、将 options 与 构造函数上的options 融合
      //    构造函数options拥有事先定义的全局 components（KeepAlive / Transitions / TransitionGroup） 和 directives（v-model / v-show）
      // 2、如果该vm为 子孙组件 ，其还会继承 父辈组件 的options
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

    // 渲染相关变量初始化
    initRender(vm)
    callHook(vm, 'beforeCreate')

    // vm的状态初始化，prop / data / computed / method / watch 都在这里完成初始化，因此也是Vue实例create的关键一步
    // vm.set() 为 data 添加属性，并绑定数据依赖
    // vm.delete() 为 data 删除属性，并解除数据依赖
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
      // 此处 new Watcher()，每一个 Watcher 跟组件对应
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

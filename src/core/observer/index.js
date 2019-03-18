/* @flow */

import Dep from './dep'
import { arrayMethods } from './array'
import {
  def,
  isObject,
  isPlainObject,
  hasProto,
  hasOwn,
  warn,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 */
export const observerState = {
  shouldConvert: true,
  isSettingProps: false
}

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that has this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    console.log('new Dep() id:' + this.dep.id + ' | value:' + value)
    this.vmCount = 0
    // 将 Observer 实例添加到 value中，键名为 __ob__
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i], obj[keys[i]])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value)) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    observerState.shouldConvert &&
    !isServerRendering() &&   // 非服务端环境
    (Array.isArray(value) || isPlainObject(value)) &&   // value为数组或对象
    Object.isExtensible(value) &&   // 可以向 value 添加新属性
    !value._isVue   // value 不是一个 vue 实例
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 数据绑定总结：
 * 1、每一个component会有一个 Watcher
 * 2、每个变量都对应一个 Dep（若变量为Object和Array时，会对应一个 new Observer()，所以data本身也对应一个Observer）
 * 3、当调用变量的 getter 时，会将变量的 Dep 和 视图的 Watcher 进行双向关联。
 * 4、当调用变量的 setter 时，会触发变量的 Dep.notify()，然后通过 Watcher 更新视图
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: Function
) {
  const dep = new Dep()
  console.log('new Dep() id:' + dep.id + ' | key: ' + key + ' | value:' + val)

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set

  // 递归，为 data 中属性为 Object类型 的属性再单独 new Observer()
  let childOb = observe(val)

  // 重写该属性的 getters 和 setters 方法
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      console.log('get | key:' + key + ' | val:' + val)
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
        }
        if (Array.isArray(value)) {
          dependArray(value)
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      console.log('set | key:' + key + ' | oldVal:' + val + ' | newVal:' + newVal)
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 如果 newVal 传入的是对象或者数组，那么就要为 newVal 新建一个 Observe() 同时更新 childOb
      // 注意，每一个 Observe 跟 data 中的 对象属性 或 数组属性 对应，包括 data 本身
      // 如果 属性变了，那么相应的也要更新 Observe()
      childOb = observe(newVal);
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 * 更改 data 中的属性值，
 * 如果是已存在属性，更改时会自动触发 dep.notify()
 * 如果是新属性，则添加之后，会手动触发 dep.notify() 更新视图
 * 此时如果页面需要这个元素，那么自然而然就会把 Watcher 绑定到新属性对应的 dep 中
 */
export function set (obj: Array<any> | Object, key: any, val: any) {
  // 如果是数组，直接设置（data不会是一个数组），此时也会触发 notify()
  if (Array.isArray(obj)) {
    obj.length = Math.max(obj.length, key)
    obj.splice(key, 1, val)
    return val
  }
  // 如果是对象，也是直接设置，触发 notify()
  if (hasOwn(obj, key)) {
    obj[key] = val
    return
  }
  const ob = obj.__ob__
  if (obj._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return
  }
  if (!ob) {
    obj[key] = val
    return
  }
  // 绑定属性到父属性上，同时重写其 get / set 方法
  defineReactive(ob.value, key, val)
  // 这一步有两个作用：
  // 1、通过 notify 更新视图；
  // 2、收集依赖，使 dep 和 watcher 相互建立链接。
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (obj: Array<any> | Object, key: any) {
  if (Array.isArray(obj)) {
    obj.splice(key, 1)
    return
  }
  const ob = obj.__ob__
  if (obj._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(obj, key)) {
    return
  }
  delete obj[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}

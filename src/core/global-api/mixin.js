/* @flow */

import { mergeOptions } from '../util/index'

// Vue.mixin方法会将传入的mixin的所有方法、对象，全部都merge到当前Vue实例中。
// 比如如果大部分地方都要监听窗口大小的改变，则利用mixin就可以。
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
  }
}

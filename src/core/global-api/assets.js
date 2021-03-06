/* @flow */

import config from '../config'
import { warn, isPlainObject } from '../util/index'


/*
  此处声明了 Vue.components / Vue.directive / Vue.filter 这三个全局方法
 */
export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  config._assetTypes.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production') {
          // 所传入的组件所要解析的html标签名，不能是html保留字或svg保留字
          if (type === 'component' && config.isReservedTag(id)) {
            warn(
              'Do not use built-in or reserved HTML elements as component ' +
              'id: ' + id
            )
          }
        }
        // isPlainObject 确认definition为一个对象
        // isPlainObject => Object.prototype.toStirng.call(definition) === '[object Object]'
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id

          // 调用extend注册一个全局组件，同时返回一个Vue的组件构造器
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }

        // 将全局的 components directive filter 注册到 Vue 构造函数的 options 当中
        // 此处的 this 指向构造函数 Vue
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}

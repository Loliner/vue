/* @flow */

import { addProp } from 'compiler/helpers'

export default function html (el: ASTElement, dir: ASTDirective) {
  if (dir.value) {
    // 根据 v-html 为节点添加 props: [{name: "innerHTML", value: "_s(value)"}]
    addProp(el, 'innerHTML', `_s(${dir.value})`)
  }
}

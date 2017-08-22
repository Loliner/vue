/* @flow */

import { addProp } from 'compiler/helpers'

export default function text (el: ASTElement, dir: ASTDirective) {
  if (dir.value) {
    // 根据 v-text 为节点添加 props: [{name: "textContent", value: "_s(value)"}]
    addProp(el, 'textContent', `_s(${dir.value})`)
  }
}

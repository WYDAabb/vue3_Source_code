import { foo } from './utils'
//foo();

 /*#__PURE__ */ foo()  //前面这个 /*#__PURE__ */ 表示代码不会产生任何副作用 所以rollup直接打包就可以 
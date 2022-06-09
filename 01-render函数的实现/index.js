//vnode节点
const obj = {
    tag: 'div',
    children: [
        { tag: 'span', children: 'hello, world' },
        { tag: 'h2', children: '你好啊 王耀达' }
    ]
};

//root 是挂载节点  obj是我们的虚拟dom 或者是vnode节点  用来渲染一个树形结构
function render(obj, root) {
    const el = document.createElement(obj.tag);

    if (typeof obj.children === 'string') {
        const text = document.createTextNode(obj.children);
        el.appendChild(text);
    } else if (obj.children) {
        //数组种递归调用 render函数来渲染页面 使用el作为root参数
        obj.children.forEach((child) => {
            render(child, el)
        })
    }
    root.appendChild(el);
}
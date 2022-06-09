//组件的话 本质上其实也是使用相同的渲染其去渲染 但是用函数返回出来或者对象 形式我们不限制
const myComponent = function () {
    return {
        tag: 'button',
        props: {
            onClick: () => {
                alert('我是div')
            }
        },
        children: '点击弹出'
    }
}


const vnode = {
    tag: myComponent
}

function render(vnode, container) {
    if (typeof vnode === 'string') {
        mountElement(vnode, container)
    } else if (typeof vnode.tag === ' function') {
        //说明vnode是组件
        mountComponent(vnode, container)
    }
}

//渲染器
function renderer(vnode, container) {
    //使用vnode tag名称创建标签名称
    const el = document.createElement(vnode.tag)
    //遍历vnode.props 将属性和事件添加到 Dom元素
    for (const key in vnode.props) {
        if (key.startsWith("on")) {
            el.addEventListener(key.substr(2).toLowerCase(),  //添加事件名称
                vnode.props[key] //事件处理函数
            )
        }
    }

    //处理children
    if (typeof vnode.children === 'string') {
        //如果children是string类型 那就表示是一个文字 写在内部就可以
        el.appendChild(document.createTextNode(vnode.children))
        //判断是否是其他内容 如果里面还包含着其他标签 那么就递归调用 eg:<div><span>xxx</span></div>
    } else if (Array.isArray(vnode.children)) {
        vnode.children.forEach(child => {
            renderer(child, el)
        });
    }
    //挂在元素
    container.appendChild(el)
}


//挂载标签节点
function mountElement(vnode, container) {
    //使用vnode tag名称创建标签名称
    const el = document.createElement(vnode.tag)
    //遍历vnode.props 将属性和事件添加到 Dom元素
    for (const key in vnode.props) {
        if (key.startsWith("on")) {
            el.addEventListener(key.substr(2).toLowerCase(),  //添加事件名称
                vnode.props[key] //事件处理函数
            )
        }
    }

    //处理children
    if (typeof vnode.children === 'string') {
        //如果children是string类型 那就表示是一个文字 写在内部就可以
        el.appendChild(document.createTextNode(vnode.children))
        //判断是否是其他内容 如果里面还包含着其他标签 那么就递归调用 eg:<div><span>xxx</span></div>
    } else if (Array.isArray(vnode.children)) {
        vnode.children.forEach(child => {
            renderer(child, el)
        });
    }
    //挂在元素
    container.appendChild(el)
}

//挂载组件节点
function mountComponent(vnode, container) {
    //调用组件函数 获取组件要渲染的内容 虚拟dom
    const subtree = vnode.tag();
    //递归调用 renderer渲染 subtree
    renderer(subtree, container)
}
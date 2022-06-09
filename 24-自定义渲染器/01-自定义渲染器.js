const vnode = {
    type: 'h1',  //描述类型 不同类型type属性可以描述多种类型的vnode
    children: 'hello'
}


//mountElement 挂载函数 有弊端 只能dom使用
function mountElement(vnode, container) {
    //使用vnode tag名称创建标签名称
    const el = document.createElement(vnode.type);
    //处理子节点 如果子节点是字符串，代表元素有文本节点
    if (typeof vnode.children === 'string') {
        //因此只需要设置元素的textContent属性即可
        el.textContent = vnode.children
    }
    //将元素添加到容器之中
    container.appendChild(el)
}


function createRenderer(options) {

    const { createElement, setElementText, insert } = options

    //mountElement 挂载函数
    function mountElement(vnode, container) {
        //使用vnode type名称创建标签名称
        const el = createElement(vnode.type);
        //处理子节点 如果子节点是字符串，代表元素有文本节点
        if (typeof vnode.children === 'string') {
            //因此只需要设置元素的文本节点
            setElementText(el, vnode.children)
        }
        //将元素添加到容器之中
        insert(el, container);
    }

    //patch函数传入三个参数 第一个旧的vnode 第二个新的vnode 第三个同期
    function patch(n1, n2, container) {
        //如果n1不存在，意味着挂载 则调用mountElement函数完成挂载
        if (!n1) {
            mountElement(n2, container);
        } else {
            //n1存在 意味着打补丁 暂时省略
        }
    }

    function render(vnode, container) {
        if (vnode) {
            //如果新的vnode存在 将其与旧的vnode一起传递给patch函数 进行打补丁 我叫做patch比较函数
            patch(container._vnode, vnode, container)
        } else {
            if (container._vnode) {
                //如果旧的vnode存在 并且新的vnode不存在 说明是卸载操作
                //需要将container内的dom清空即可
                container.innerHTML = ''
            }
        }
        //将vnode存储到container._vnode下面 既后续渲染中旧的vnode
        container._vnode = vnode
    }

    return {
        render
    }
}

const options1 = {  //浏览器使用
    //用于创建元素
    createElement(tag) {
        return document.createElement(tag);
    },
    //用于设置元素的文本节点
    setElementText(el, text) {
        el.textContent = text;
    },
    //用于给定的parent下添加指定元素
    insert(el, parent, anchor = null) {
        parent.insertBefore(el, anchor)
    }

}

const options2 = { //node使用
    //用于创建元素
    createElement(tag) {
        console.log(`创建元素${tag}`);
        return { tag }
    },
    //用于设置元素的文本节点
    setElementText(el, text) {
        console.log(`设置${JSON.stringify(el)}的文本内容：${text}`);
        el.textContent = text;
    },
    //用于给定的parent下添加指定元素
    insert(el, parent, anchor = null) {
        console.log(`将${JSON.stringify(el)}添加到${JSON.stringify(parent)}下`);
        parent.children = el
    }
}

// 将浏览器中的domAPI抽离出来 作为配置项传入
const renderer = createRenderer(options2)
//调用render函数渲染该vnode
renderer.render(vnode, document.querySelector('#app'))
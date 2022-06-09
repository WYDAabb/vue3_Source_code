const map = new Map();

const map1 = new Map();
map1.set({ name: '111' }, '111')
const map2 = new Map();
map2.set({ name: '222' }, '222')
const map3 = new Map();
map3.set({ name: '333' }, '333')

map.set({ name: '响应式' }, [map1, map2, map3]);

map.forEach((item, i) => {
    item.forEach((ele, key) => {
        console.log(ele);
    })
})
// const set = new Set([1]);
// set.forEach((item) => {
//     set.delete(1);
//     set.add(1);
//     console.log('遍历中');
// })


//解决

const set = new Set([1]);
const newSet = new Set(set);
console.log(newSet);
//遍历新的set 而不是之前的set 所以不会产生递归
newSet.forEach((item) => {
    set.delete(1);
    set.add(1);
    console.log('遍历中');
})

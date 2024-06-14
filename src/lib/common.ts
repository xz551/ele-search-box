import {toRaw,  isRef, isProxy,cloneVNode, isVNode} from "vue";

/**
 * 随机数
 * @param leng
 */
export function random(leng: number = 6): string {
    let s = Math.random().toString(36).substring(2,leng+2)
    if(s.length<leng)
        return s+random(leng-s.length)
    return s;
}

/**
 * 深拷贝
 */
export function deepCopy<T extends object>(object: T):T {
    if (Array.isArray(object)) {
        // @ts-ignore
        let result:T[] = [];
        object.forEach((item:any) => {
            result.push(deepCopy(item));
        })
        // @ts-ignore
        return result;
    }
    if(isVNode(object)){
        //@ts-ignore
        return cloneVNode(object,{})
    }
    if(isProxy(object)){
        let r =  toRaw(object);
        if(Object.prototype.toString.call(r) === '[object Object]'){
            return deepCopy(r)
        }
        return r;
    }
    if (!isRef(object) && !isProxy(object) && !isVNode(object) &&  Object.prototype.toString.call(object) === '[object Object]') {
        let result = {} as T;
        for (let n in object) {
            // @ts-ignore
            result[n] = deepCopy(object[n])
        }
        return result
    }
    return object;

}
/**
 * 防抖函数
 * 使用：debounce(fun1,1000)(参数1,参数2,...)
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟执行时间
 * @returns {Function}
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number=100): T {
    let timeoutId:any=0
    return function (this:any,...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    } as T;
}


export default {}
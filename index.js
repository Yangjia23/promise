const ENUM = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

const resolvePromise = (x, promise2, resolve, reject) => {
  // (1) 同一个引用
  if (x === promise2) {
    reject(new TypeError('TypeError: xxx'))
  }

  // (2) x 可能是obj 或 fun
  let called = false
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    // 
    try {
      const then = x.then
      if (typeof then === 'function') {
        then.call(x, y => {
          if (called) return
          called = true
          // () y 可能还是个 promise
          resolvePromise(y, promise2, resolve, reject)
        }, e => {
          if (called) return
          called = true
          reject(e)
        })
      } else {
        // () x 为普通对象
        resolve(x)
      }
    } catch (error) {
      if (called) return
      called = true
      reject(error)
    }
  } else {
    // () x 为普通值
    resolve(x)
  }
}


class Promise {
  constructor (executor) {
    this.status = ENUM.PENDING
    this.value = undefined
    this.reason = undefined
    this.onFulfilledCallbackList = []
    this.onRejectedCallbackList = []
    const resolve = (value) => {
      if(value instanceof Promise){
        // 递归解析 
        return value.then(resolve,reject)
      }
      if (this.status === ENUM.PENDING) {
        this.status = ENUM.FULFILLED
        this.value = value
        this.onFulfilledCallbackList.forEach(cb => cb())
      }
    }
    const reject = (error) => {
      if (this.status === ENUM.PENDING) {
        this.status = ENUM.REJECTED
        this.reason = error
        this.onRejectedCallbackList.forEach(cb => cb())
      }
    }
    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }
  then (onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : e => {throw e}
    let promise2 = new Promise((resolve, reject) => {
      if (this.status === ENUM.FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value)
            resolvePromise(x, promise2, resolve, reject)
          } catch (error) {
            reject(error)
          }
        }, 0)
      }
      if (this.status === ENUM.REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason)
            resolvePromise(x, promise2, resolve, reject)
          } catch (error) {
            reject(error)
          }
        }, 0)
      }
      if (this.status === ENUM.PENDING) {
        this.onFulfilledCallbackList.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value)
              resolvePromise(x, promise2, resolve, reject)
            } catch (error) {
              reject(error)
            }
          }, 0)
        })
        this.onRejectedCallbackList.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason)
              resolvePromise(x, promise2, resolve, reject)
            } catch (error) {
              reject(error)
            }
          }, 0)
        })
      }
    })
    return promise2
  }
  catch (errCallback) {
    return this.then(null, errCallback)
  }
  static resolve(value){
  	return new Promise((resolve, reject) => {
    	resolve(value)
    })
  }
  static reject(reason){
  	return new Promise((resolve, reject) => {
    	reject(reason)
    })
  }
  static all (arrList) {
    if (!Array.isArray(arrList)) {
      const type = typeof arrList;
      return new TypeError(`TypeError: ${type} ${arrList} is not iterable`)
    }
    return new Promise((resolve, reject) => {
      const backArr = []
      const count = 0
      const processResultByKey = (value, index) => {
        backArr[index] = value
        if (++count === arrList.length) {
          resolve(backArr)
        } 
      }
      for (let i = 0; i < arrList.length; i++) {
        const item = arrList[i];
        if (item && item.then === 'function') {
          item.then((value) => {
            processResultByKey(value, i)
          }, reject)
        } else {
          processResultByKey(item, i)
        }
      }
    })
  }
  static race(arrList) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < arrList.length; i++) {
        const value = arrList[i];
        if (value && value.then === 'function') {
          value.then(resolve, reject)
        } else {
          resolve(value)
        }
      }
    })
  }
  finally (callback) {
    return this.then((value) => {
        return Promise.resolve(callback()).then(() => value)
    }, (err) => {
        console.log('err', err);
        return Promise.resolve(callback()).then(() => { throw err })
    });
  }
}

Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve,reject)=>{
      dfd.resolve = resolve;
      dfd.reject = reject;
  });
  return dfd;
}

module.exports = Promise;

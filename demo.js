const Promise = require('./index')

Promise.resolve(100).finally((data) => {
	console.log('finally: ', data)
}).then(data => {
  console.log('success: ', data)
})
// finally:  undefined
// success:  100

// (2) 等待执行
// 返回一个执行成功的 promise, 但向下传递但还是上一次执行结果
Promise.resolve(100).finally(() => {
  return new Promise((resolve, reject) => {
  	setTimeout(() => {
    	resolve(200)
    }, 1000)
  })
}).then(data => {
  console.log('success: ', data) // success:  100
})

// 当 promise 执行失败，则将该 promise 执行结果向下传递

const wrap = (promise) => {
  let abort;
  let newPromise = new Promise((resolve, reject) => {
    abort = reject;
  });
  let p = Promise.race([promise, newPromise]);
  console.log(p)
  p.abort = abort;
  return p;
};

const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    // 模拟异步请求
    resolve("hello");
  }, 5000);
});
const newP1 = wrap(p1);
setTimeout(() => {
  // 设置超时时间
  newP1.abort("请求超时了");
}, 4000);
newP1
  .then((data) => {
    console.log("success:", data);
  })
  .catch((err) => {
    console.log("error:", err);
  });


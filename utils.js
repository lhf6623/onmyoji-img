import { get } from "https";

function isString(o) {
  return Object.prototype.toString.call(o) === "[object String]";
}
/**
 *
 * @param {String} url
 * @param {{encod?: String}} opt
 * @returns {Promise<Array<any>>}
 */
export const request = async (url, opt) => {
  return await new Promise((resole, reject) => {
    get(url, (res) => {
      let { statusCode } = res;
      if (statusCode !== 200) {
        res.resume(new Error(`请求失败。状态码：${statusCode}`));
        reject();
        return;
      }
      isString(opt?.encod) && res.setEncoding(opt.encod);
      let _data = [];
      res.on("data", (data) => {
        _data.push(data);
      });

      res.on("end", () => {
        resole(_data);
      });
    }).on("error", (e) => {
      reject(e);
    });
  });
};

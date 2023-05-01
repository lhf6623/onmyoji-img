import { existsSync, mkdirSync, createWriteStream } from "fs";
import { load } from "cheerio";
import { request } from "./utils.js";

const URL = "https://yys.163.com/media/picture.html";
const BASE_PATH = "https://yys.res.netease.com/";
// 试试多个请求下载
const multiple = 10;
// 需要下载的图片集合
let urlDataArr = [];

// 默认下载全部尺寸的图片
const IMG_SIZES = ["1366x768"];

/**
 * 创建目录
 * @param {String} url
 * @returns
 */
function depthMkdirsSync(url) {
  if (existsSync(url)) return;
  let parts = url.split("/").filter((part) => !!part);
  let path = "";
  for (let i = 0; i < parts.length; i++) {
    path += parts[i] + "/";
    if (!existsSync(path)) {
      mkdirSync(path);
    }
  }
}

/**
 * 下载保存图片
 * @param {Array<{url: String; size: String; name: String}>} arr
 */
const savedImg = async (imgs) => {
  if (!imgs) return;
  const { url, size, name } = imgs;
  const _url = `img/${size}/${name}.jpg`;

  if (existsSync(_url)) {
    if (urlDataArr.length) {
      setTimeout(() => {
        savedImg(urlDataArr.shift());
      }, 0);
    } else {
      console.log("下载完毕");
    }
    return;
  }

  console.log(`正在下载[${name}]\n`);
  try {
    const imgBuf = await request(url);
    const len = imgBuf.reduce((t, n) => t + n.length, 0);
    const img = Buffer.concat(imgBuf, len);

    const stream = createWriteStream(_url);
    stream.end(img);

    console.log(`[${name}]文件下载完毕，剩余[${urlDataArr.length}]\n`);
  } catch (e) {
    console.log(`🚀 ~ e:`, e);
  } finally {
    if (urlDataArr.length) {
      setTimeout(() => {
        savedImg(urlDataArr.shift());
      }, 0);
    } else {
      console.log("下载完毕");
    }
  }
};

const statrtRequest = async (url) => {
  // 请求目标地址
  const html = await request(url, { encod: "utf-8" });
  const $ = load(html.join(""));
  let urlDataArr = [];
  $(".target").each((_, item) => {
    let url = item.attribs["href"];
    if (
      url.includes(BASE_PATH) &&
      IMG_SIZES.some((size) => url.includes(size))
    ) {
      const size = url.split("/").pop().split(".")[0];
      const name = url.split("/data/picture/")[1].replace(/[\/\.\?]/g, "_");
      urlDataArr.push({ url, size, name });
    }
  });

  // 创建目录 --根据 图片尺寸 IMG_SIZES 创建目录
  IMG_SIZES.map((size) => {
    depthMkdirsSync(`img/${size}`);
  });
  // 下载保存图片
  return urlDataArr;
};
urlDataArr = await statrtRequest(URL);
for (let i = 0; i < multiple; i++) {
  const _img = urlDataArr.shift();
  savedImg(_img);
}

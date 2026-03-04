const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// 请求配置
const config = {
  url: "https://market.paic.com.cn/resource",
  method: "POST",
  headers: {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "application/json;charset=UTF-8",
    Cookie:
      "ws_auth=1c2c7f9f(413968|9RMDI_V9MULBsRmo4I8nVquyHf29rA8o1scEpCPVUw6555qI2TB0amQa1v2WT59w1vXxSo...",
    Origin: "https://market.paic.com.cn",
    Pragma: "no-cache",
    Referer: "https://market.paic.com.cn/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "sec-ch-ua":
      '"Chromium";v="134", "Not=A?Brand";v="24", "Google Chrome";v="134"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
  },
  data: {
    channelCode: "skills",
    childCode: "",
    sortField: "versionTime",
    currentPage: 2,
    pageSize: 20,
    keyword: "",
  },
};

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, "skills-config.json");

// 将请求参数转换为 JSON 字符串
const postData = JSON.stringify(config.data, null, 2);

// 设置请求头，包括内容长度
config.headers["Content-Length"] = Buffer.byteLength(postData);

// 根据 URL，选择 http 或 https 模块
const protocol = config.url.startsWith("https") ? https : http;

// 解析 URL
const urlObj = new URL(config.url);
const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || (config.url.startsWith("https") ? 443 : 80),
  path: urlObj.pathname + urlObj.search,
  method: config.method,
  headers: config.headers,
};

// 获取技能列表
const getSkillsList = () => {
  const req = protocol.request(options, (res) => {
    let responseData = "";

    console.log("状态码:", res.statusCode);

    res.on("data", (chunk) => {
      responseData += chunk;
    });

    res.on("end", () => {
      console.log("请求完成");

      try {
        // 解析 JSON 响应
        const result = JSON.parse(responseData);

        // 如果返回的数据中有列表，提取并排序
        if (result && result.data && result.data.list) {
          const list = result.data.list;

          console.log("====== Skills 列表 ======");
          console.log(`共获取到 ${list.length} 个技能\n`);

          list.forEach((item, index) => {
            console.log(`${index + 1}. ${item.title || item.name}`);
            console.log(`   版本: ${item.version || "未知"}`);
            console.log(`   ID: ${item.id || "未知"}`);
            console.log(`   AppId: ${item.appId || "未知"}`);

            if (item.desc) {
              console.log(
                `   描述: ${item.desc.substring(0, 100)}${item.desc.length > 100 ? "..." : ""}`,
              );
            }

            console.log("");
          });

          // 读取现有配置文件（如果存在）
          let existingConfig = {};
          if (fs.existsSync(CONFIG_FILE)) {
            try {
              const existingData = fs.readFileSync(CONFIG_FILE, "utf8");
              existingConfig = JSON.parse(existingData);
              console.log("已加载现有配置文件");
            } catch (error) {
              console.error("读取现有配置文件时出错:", error.message);
            }
          }

          // 更新配置：保存原有配置，更新 skills 列表
          const newConfig = {
            ...existingConfig,
            lastUpdated: new Date().toISOString(),
            skills: list,
            total: list.length,
          };

          // 保存更新后的配置
          fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
          console.log("配置文件已更新：", CONFIG_FILE);
          console.log("最后更新时间：", newConfig.lastUpdated);
          console.log("技能总数：", newConfig.total);
        }
      } catch (error) {
        console.error("解析或保存配置失败：", error.message);
        console.log("错误数据：", responseData);

        // 保存错误日志
        const errorFilePath = path.join(
          __dirname,
          `skills-list-error-${Date.now()}.txt`,
        );
        fs.writeFileSync(errorFilePath, responseData);
        console.log("错误日志已保存到：", errorFilePath);
        process.exit(1);
      }

      console.log("已获取所有配置文件");
    });
  });

  // 错误处理
  req.on("error", (error) => {
    console.error("请求失败:", error.message);
    process.exit(1);
  });

  // 发送请求数据
  req.write(postData);
  req.end();
};

// 执行获取技能列表
getSkillsList();

// server.js - 简化版后端(用户名登录)
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
// 明确使用当前文件目录下的 .env，避免从项目根或其它工作目录启动时找不到 env
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// 诊断信息：输出当前工作目录和 .env 加载情况，方便排查 API_KEY 未被读取的问题
try {
  const cwd = process.cwd();
  const envPath = require("path").join(__dirname, ".env");
  const hasApiKey = !!process.env.API_KEY;
  console.log(`🔍 启动诊断: CWD=${cwd}, server.js dirname=${__dirname}`);
  console.log(`🔍 期望 .env 路径: ${envPath}`);
  if (hasApiKey) {
    console.log(`✅ 检测到 API_KEY（长度=${process.env.API_KEY.length}）`);
  } else {
    console.warn("⚠️ 未检测到 API_KEY 环境变量（process.env.API_KEY 为空）");
  }
} catch (e) {
  console.error("诊断日志输出失败:", e);
}

const app = express();
app.use(cors());
app.use(express.json());

// 简单请求日志，便于排查 404/鉴权问题
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  next();
});

// ========== 导入模型 ==========
const FoodLog = require("./models/FoodLog");
const HealthProfile = require("./models/HealthProfile");
const Food = require("./models/Food");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/nutrition_db";

// ========== AI配置 ==========
// 使用通用的API_KEY
const API_KEY = process.env.API_KEY;
// AI API端点
const AI_API_BASE_URL = process.env.AI_API_BASE_URL;

// ========== 连接 MongoDB ==========
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB 连接成功"))
  .catch((err) => console.error("❌ MongoDB 连接失败:", err));

// ========== 用户模型 ==========
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

// 从 AI 返回的文本中安全提取 JSON 字符串并解析。
// 处理常见情况：直接 JSON、带 ``` 或 ```json 代码块、或其它多余文字包裹 JSON。
function parseJSONSafe(text) {
  if (typeof text !== "string") throw new Error("解析失败：输入不是字符串");

  // 1) 直接尝试解析
  try {
    return JSON.parse(text);
  } catch (e) {
    // 继续尝试
  }

  // 2) 如果包含代码块 ```json ... ``` 或 ``` ... ```，提取其中内容
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch (e) {
      // 解析失败，继续后续尝试
    }
  }

  // 3) 尝试提取第一个 { 到最后一个 } 之间的内容（宽松模式）
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonSubstring = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonSubstring);
    } catch (e) {
      // 仍然无法解析
    }
  }

  // 无法解析，抛出友好错误并包含一部分原始内容以便调试（不显示过长）
  const snippet = text.substring(0, 1000);
  throw new Error("无法从AI返回中解析JSON。返回内容示例: " + snippet);
}

// ========== 注册接口 ==========
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: "用户名和密码不能为空" });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: "用户名至少需要3个字符" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "密码至少需要6个字符" });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "该用户名已被注册" });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save();

    // 生成 JWT Token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "注册成功",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("注册错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// ========== 登录接口 ==========
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: "用户名和密码不能为空" });
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 生成 JWT Token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "登录成功",
      token,
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// ========== 验证Token中间件 ==========
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "未提供认证令牌" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "令牌无效或已过期" });
    }
    req.user = user;
    next();
  });
};

// ========== 获取用户信息 ==========
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    res.json(user);
  } catch (error) {
    console.error("获取用户信息错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// ========== 用户健康档案(HealthProfile) ==========
// 获取当前用户的健康档案
app.get("/api/health-profile", authenticateToken, async (req, res) => {
  try {
    let profile = await HealthProfile.findOne({ userId: req.user.userId });

    // 如果还没有档案，返回一个空的默认结构，方便前端展示
    if (!profile) {
      return res.json({
        userId: req.user.userId,
        height: null,
        weight: null,
        gender: "male",
        age: null,
        activityLevel: "sedentary",
        goal: "maintain",
        targetCalories: null,
        updatedAt: null,
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("获取健康档案错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 更新/创建当前用户的健康档案
app.put("/api/health-profile", authenticateToken, async (req, res) => {
  try {
    const { height, weight, gender, age, activityLevel, goal } = req.body;

    if (!height || !weight || !age) {
      return res.status(400).json({ error: "请填写身高、体重和年龄" });
    }

    // 计算 TDEE 和推荐目标热量（与前端 Profile 页面保持一致的公式）
    let bmr;
    if (gender === "male") {
      bmr =
        10 * parseFloat(weight) +
        6.25 * parseFloat(height) -
        5 * parseInt(age) +
        5;
    } else {
      bmr =
        10 * parseFloat(weight) +
        6.25 * parseFloat(height) -
        5 * parseInt(age) -
        161;
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      heavy: 1.725,
    };

    let tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

    if (goal === "lose_weight") {
      tdee -= 500;
    } else if (goal === "gain_muscle") {
      tdee += 300;
    }

    const targetCalories = Math.round(tdee);

    const update = {
      height: parseFloat(height),
      weight: parseFloat(weight),
      gender,
      age: parseInt(age),
      activityLevel,
      goal,
      targetCalories,
      updatedAt: new Date(),
    };

    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    };

    const profile = await HealthProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { userId: req.user.userId, ...update },
      options
    );

    res.json(profile);
  } catch (error) {
    console.error("更新健康档案错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// ========== 饮食记录API ==========
// 创建饮食记录
app.post("/api/food-logs", authenticateToken, async (req, res) => {
  try {
    const { foodName, mealType, calories, protein, fat, carbs, portion } =
      req.body;

    if (!foodName || calories === undefined) {
      return res.status(400).json({ error: "食物名称和热量为必填项" });
    }

    const foodLog = new FoodLog({
      userId: req.user.userId,
      foodName,
      mealType: mealType || "breakfast",
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      fat: parseFloat(fat) || 0,
      carbs: parseFloat(carbs) || 0,
      portion: parseFloat(portion) || 1,
    });

    await foodLog.save();
    res.status(201).json(foodLog);
  } catch (error) {
    console.error("创建饮食记录错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 获取今日饮食记录
app.get("/api/food-logs/today", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await FoodLog.find({
      userId: req.user.userId,
      loggedAt: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ loggedAt: -1 });

    res.json(logs);
  } catch (error) {
    console.error("获取今日饮食记录错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 获取历史饮食记录（可按日期范围查询）
app.get("/api/food-logs", authenticateToken, async (req, res) => {
  try {
    // 支持查询参数 ?startDate=2024-01-01&endDate=2024-01-31
    const { startDate, endDate, limit = 200 } = req.query;

    // 为避免时区导致的“跨天”问题，使用 UTC 边界
    const parseUtcDate = (str) => {
      if (!str) return null;
      const [y, m, d] = str.split("-").map((v) => parseInt(v, 10));
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    };

    const start = parseUtcDate(startDate) || new Date(0); // 默认最早
    const endDay = parseUtcDate(endDate) || new Date();

    // endExclusive = 结束日期的下一天 00:00 (UTC)，用 $lt 避免包含下一天/今天
    const endExclusive = new Date(endDay);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

    console.log("📅 查询饮食记录", {
      userId: req.user.userId,
      start: start.toISOString(),
      endExclusive: endExclusive.toISOString(),
      limit,
      rawQuery: req.query,
    });

    const logs = await FoodLog.find({
      userId: req.user.userId,
      loggedAt: {
        $gte: start,
        $lt: endExclusive,
      },
    })
      .sort({ loggedAt: -1 })
      .limit(parseInt(limit, 10));

    res.json(logs);
  } catch (error) {
    console.error("获取历史饮食记录错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 删除饮食记录
app.delete("/api/food-logs/:id", authenticateToken, async (req, res) => {
  try {
    const log = await FoodLog.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!log) {
      return res.status(404).json({ error: "记录不存在" });
    }

    await FoodLog.deleteOne({ _id: req.params.id });
    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除饮食记录错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// ========== 获取今日营养摄入汇总 ==========
app.get("/api/nutrition/today", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await FoodLog.find({
      userId: req.user.userId,
      loggedAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        fat: acc.fat + (log.fat || 0),
        carbs: acc.carbs + (log.carbs || 0),
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    // 获取用户健康档案以计算目标值
    const profile = await HealthProfile.findOne({ userId: req.user.userId });
    const targetCalories = profile?.targetCalories || 2000;

    res.json({
      totals,
      targetCalories,
      logsCount: logs.length,
    });
  } catch (error) {
    console.error("获取今日营养摄入错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 使用 AI 进行健康评估
async function calculateHealthAssessmentWithAI(logs, profile, totals, targets) {
  // 动态导入fetch（Node.js 18+内置，否则需要node-fetch）
  let fetchFn;
  try {
    if (typeof fetch !== "undefined") {
      fetchFn = fetch;
    } else {
      const nodeFetch = await import("node-fetch");
      fetchFn = nodeFetch.default;
    }
  } catch (e) {
    throw new Error("需要Node.js 18+或安装node-fetch包");
  }

  if (!API_KEY || !AI_API_BASE_URL) {
    throw new Error("AI配置缺失，请在.env中设置 API_KEY 和 AI_API_BASE_URL");
  }

  const simplifiedLogs = logs.map((log) => ({
    mealType: log.mealType,
    foodName: log.foodName,
    calories: log.calories,
    protein: log.protein,
    fat: log.fat,
    carbs: log.carbs,
    portion: log.portion,
    loggedAt: log.loggedAt,
  }));

  const prompt = `
你是一名专业的营养与健康评估专家。请根据用户今日的饮食记录和健康档案，给出一个 0-100 的健康评分，并给出清晰的中文建议。

【用户健康档案】（如果某些字段为空，请合理假设）:
${JSON.stringify(
  {
    height: profile?.height,
    weight: profile?.weight,
    age: profile?.age,
    gender: profile?.gender,
    activityLevel: profile?.activityLevel,
    goal: profile?.goal,
    targetCalories: targets.calories,
  },
  null,
  2
)}

【今日饮食记录】（每条代表一次进食）:
${JSON.stringify(simplifiedLogs, null, 2)}

【今日营养汇总】:
${JSON.stringify(totals, null, 2)}

【目标摄入参考】:
${JSON.stringify(targets, null, 2)}

请你基于以上信息，综合判断今天的饮食是否符合健康和用户目标，并【严格】按照下面的 JSON 结构返回，不要包含任何多余文字或注释：
{
  "score": 0-100 的整数,
  "level": "优秀" 或 "良好" 或 "需改进",
  "levelColor": "green" 或 "yellow" 或 "red",
  "suggestions": ["建议1", "建议2", "..."],
  "progress": {
    "calories": 热量完成度(实际/目标的比例, 如 0.8 表示 80%),
    "protein": 蛋白质完成度,
    "fat": 脂肪完成度,
    "carbs": 碳水完成度
  }
}
如果记录非常少（少于2条），请在建议中提醒“记录过少，评估可能不够准确”。`;

  const apiUrl = `${AI_API_BASE_URL}`;
  console.log("🤖 使用AI进行健康评估...");
  console.log("📡 健康评估 API端点:", apiUrl);

  const response = await fetchFn(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "glm-4.6",
      messages: [
        {
          role: "system",
          content: "你是一名专业的营养与健康评估专家。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      stream: false,
    }),
  });

  const startTime = Date.now();
  const data = await response.json();
  const elapsed = Date.now() - startTime;
  console.log(
    `AI 健康评估 API 请求耗时: ${elapsed} ms, 状态码: ${response.status}`
  );
  if (!response.ok) {
    console.error("❌ AI 健康评估 API 错误响应:", data);
    throw new Error(
      data.error?.message || `AI 健康评估调用失败 (状态码: ${response.status})`
    );
  }

  const content = data.choices?.[0]?.message?.content;
  console.log("📄 AI 健康评估返回内容:", content);
  if (typeof content !== "string") {
    throw new Error("AI健康评估返回内容格式异常");
  }

  try {
    return parseJSONSafe(content);
  } catch (e) {
    console.error("❌ AI健康评估 JSON解析失败:", e);
    throw new Error(
      "AI健康评估返回的JSON格式错误: " +
        (typeof content === "string"
          ? content.substring(0, 200)
          : String(content))
    );
  }
}

// ========== AI健康评估 ==========
app.get("/api/health/assessment", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 获取今日饮食记录
    const logs = await FoodLog.find({
      userId: req.user.userId,
      loggedAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    // 如果没有任何记录，直接返回空评估
    if (logs.length === 0) {
      return res.json({
        score: 0,
        level: "需改进",
        levelColor: "red",
        suggestions: ["还没有记录今日饮食，请开始记录您的饮食"],
        totals: { calories: 0, protein: 0, fat: 0, carbs: 0 },
        targets: {
          calories: 2000,
          protein: 0,
          fat: 0,
          carbs: 0,
        },
        progress: {
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
        },
      });
    }

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        fat: acc.fat + (log.fat || 0),
        carbs: acc.carbs + (log.carbs || 0),
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    // 获取用户健康档案
    const profile = await HealthProfile.findOne({ userId: req.user.userId });
    const targetCalories = profile?.targetCalories || 2000;

    // 简单按常规比例估算目标宏量营养素，用于 progress 计算
    const proteinTarget = (targetCalories * 0.15) / 4;
    const fatTarget = (targetCalories * 0.25) / 9;
    const carbsTarget = (targetCalories * 0.6) / 4;

    const targets = {
      calories: targetCalories,
      protein: proteinTarget,
      fat: fatTarget,
      carbs: carbsTarget,
    };

    // 调用 AI 进行健康评估
    let aiResult;
    try {
      aiResult = await calculateHealthAssessmentWithAI(
        logs,
        profile,
        totals,
        targets
      );
    } catch (aiError) {
      console.error(
        "AI 健康评估调用失败，回退到本地简单评估:",
        aiError.message
      );

      // 回退：如果 AI 出错，至少返回基础信息
      return res.json({
        score: 0,
        level: "需改进",
        levelColor: "red",
        suggestions: [
          "AI评估暂时不可用，请稍后重试。",
          "您可以先参考首页显示的营养摄入情况进行自我调整。",
        ],
        totals,
        targets,
        progress: {
          calories: totals.calories / targetCalories,
          protein: proteinTarget ? totals.protein / proteinTarget : 0,
          fat: fatTarget ? totals.fat / fatTarget : 0,
          carbs: carbsTarget ? totals.carbs / carbsTarget : 0,
        },
      });
    }

    // 组合 AI 结果与本地计算的 totals/targets/progress，保持前端兼容
    const score = typeof aiResult.score === "number" ? aiResult.score : 0;
    const level = aiResult.level || "需改进";
    const levelColor =
      aiResult.levelColor ||
      (score >= 80 ? "green" : score >= 60 ? "yellow" : "red");
    const suggestions =
      Array.isArray(aiResult.suggestions) && aiResult.suggestions.length > 0
        ? aiResult.suggestions
        : ["今天的饮食评估已完成，请继续保持记录和调整饮食结构。"];

    const progress = aiResult.progress || {
      calories: totals.calories / targetCalories,
      protein: proteinTarget ? totals.protein / proteinTarget : 0,
      fat: fatTarget ? totals.fat / fatTarget : 0,
      carbs: carbsTarget ? totals.carbs / carbsTarget : 0,
    };

    res.json({
      score: Math.round(score),
      level,
      levelColor,
      suggestions,
      totals,
      targets,
      progress,
    });
  } catch (error) {
    console.error("AI健康评估错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// ========== 食物库API ==========
// 搜索食物
app.get("/api/foods/search", authenticateToken, async (req, res) => {
  try {
    const { q, category } = req.query;
    let query = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { nameEn: { $regex: q, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const foods = await Food.find(query).limit(50).sort({ name: 1 });
    res.json(foods);
  } catch (error) {
    console.error("搜索食物错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 获取所有食物分类
app.get("/api/foods/categories", authenticateToken, async (req, res) => {
  try {
    const categories = await Food.distinct("category");
    res.json(categories);
  } catch (error) {
    console.error("获取分类错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 获取单个食物详情
app.get("/api/foods/:id", authenticateToken, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ error: "食物不存在" });
    }
    res.json(food);
  } catch (error) {
    console.error("获取食物详情错误:", error);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 创建食物（管理员功能，暂时开放给所有用户）
app.post("/api/foods", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      nameEn,
      category,
      calories,
      protein,
      fat,
      carbs,
      fiber,
      description,
    } = req.body;

    if (!name || calories === undefined) {
      return res.status(400).json({ error: "食物名称和热量为必填项" });
    }

    const food = new Food({
      name,
      nameEn,
      category: category || "其他",
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      fat: parseFloat(fat) || 0,
      carbs: parseFloat(carbs) || 0,
      fiber: parseFloat(fiber) || 0,
      description,
    });

    await food.save();
    res.status(201).json(food);
  } catch (error) {
    console.error("创建食物错误:", error);
    if (error.code === 11000) {
      res.status(400).json({ error: "该食物已存在" });
    } else {
      res.status(500).json({ error: "服务器错误" });
    }
  }
});

// ========== AI营养计算 ==========
async function calculateNutritionWithAI(foodDescription) {
  const prompt = `请根据以下食物描述，计算其营养信息（每100克的含量）。请以JSON格式返回，包含以下字段：
{
  "name": "食物名称",
  "calories": 热量（千卡）,
  "protein": 蛋白质（克）,
  "fat": 脂肪（克）,
  "carbs": 碳水化合物（克）,
  "fiber": 纤维（克，可选）,
  "portion": 建议份量（克，可选）
}

食物描述：${foodDescription}

请只返回JSON，不要包含其他文字说明。如果无法确定某些数值，请使用0。`;

  // 动态导入fetch（Node.js 18+内置，否则需要node-fetch）
  let fetchFn;
  try {
    // 尝试使用内置fetch
    if (typeof fetch !== "undefined") {
      fetchFn = fetch;
    } else {
      // 如果没有内置fetch，尝试导入node-fetch
      const nodeFetch = await import("node-fetch");
      fetchFn = nodeFetch.default;
    }
  } catch (e) {
    throw new Error("需要Node.js 18+或安装node-fetch包");
  }

  try {
    if (API_KEY && AI_API_BASE_URL) {
      // 使用自定义 AI API（兼容 OpenAI 格式）
      console.log("🤖 使用AI API进行营养计算...");
      const apiUrl = `${AI_API_BASE_URL}`;
      console.log("📡 API端点:", apiUrl);

      const response = await fetchFn(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "glm-4.6",
          messages: [
            {
              role: "system",
              content:
                "你是一个专业的营养分析助手，请根据用户提供的食物描述，严格按照要求返回规范的 JSON 数据。",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 1.0,
          stream: false,
        }),
      });

      const startTime = Date.now();
      const data = await response.json();
      const elapsed = Date.now() - startTime;
      console.log(
        `AI 营养计算 API 请求耗时: ${elapsed} ms, 状态码: ${response.status}`
      );
      if (!response.ok) {
        console.error("❌ AI API错误响应:", data);
        throw new Error(
          data.error?.message || `AI API调用失败 (状态码: ${response.status})`
        );
      }

      const content = data.choices?.[0]?.message?.content;
      console.log("📄 AI返回内容:", content);
      if (typeof content !== "string") {
        throw new Error("AI返回内容格式异常");
      }

      try {
        return parseJSONSafe(content);
      } catch (parseError) {
        console.error("❌ JSON解析失败:", parseError);
        throw new Error("AI返回的JSON格式错误: " + content.substring(0, 200));
      }
    } else if (!API_KEY) {
      throw new Error("未配置AI API密钥，请在.env文件中设置API_KEY");
    } else {
      throw new Error(
        "未配置AI_API_BASE_URL，请在.env文件中设置AI_API_BASE_URL"
      );
    }
  } catch (error) {
    console.error("❌ AI营养计算函数错误:", error.message);
    console.error("错误堆栈:", error.stack);
    throw error;
  }
}

// ========== AI智能推荐功能 ==========
async function generateMealRecommendationWithAI(profile, goal) {
  let fetchFn;
  try {
    if (typeof fetch !== "undefined") {
      fetchFn = fetch;
    } else {
      const nodeFetch = await import("node-fetch");
      fetchFn = nodeFetch.default;
    }
  } catch (e) {
    throw new Error("需要Node.js 18+或安装node-fetch包");
  }

  if (!API_KEY || !AI_API_BASE_URL) {
    throw new Error("AI配置缺失，请在.env中设置 API_KEY 和 AI_API_BASE_URL");
  }

  // 计算BMR和TDEE
  let bmr = 1500; // 默认值
  if (profile && profile.weight && profile.height && profile.age && profile.gender) {
    if (profile.gender === "male") {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    heavy: 1.725,
  };

  const activityLevel = profile?.activityLevel || "sedentary";
  const tdee = bmr * activityMultipliers[activityLevel];

  // 根据目标调整热量
  let targetCalories = tdee;
  let goalDescription = "维持";
  if (goal === "减脂") {
    targetCalories = tdee - 500;
    goalDescription = "减脂";
  } else if (goal === "增肌") {
    targetCalories = tdee + 300;
    goalDescription = "增肌";
  } else {
    goalDescription = "维持";
  }

  const prompt = `
你是一名专业的营养师。请根据用户的身体状况和目标，生成个性化的一日三餐食谱。

【用户信息】:
- 身高: ${profile?.height || "未知"} cm
- 体重: ${profile?.weight || "未知"} kg
- 年龄: ${profile?.age || "未知"} 岁
- 性别: ${profile?.gender === "male" ? "男" : profile?.gender === "female" ? "女" : "未知"}
- 活动水平: ${activityLevel === "sedentary" ? "久坐" : activityLevel === "light" ? "轻度活动" : activityLevel === "moderate" ? "中度活动" : "高强度活动"}
- 基础代谢率(BMR): ${Math.round(bmr)} 千卡
- 每日总消耗(TDEE): ${Math.round(tdee)} 千卡

【目标】: ${goalDescription}
【目标每日摄入】: ${Math.round(targetCalories)} 千卡

请根据以上信息，生成适合该用户的一日三餐食谱。请注意：
1. 食物份量要根据用户的体重和目标进行调整
2. 如果是减脂，选择低脂高蛋白的食物
3. 如果是增肌，增加蛋白质和碳水的摄入
4. 如果是维持，保持营养均衡
5. 三餐的热量分配要合理（早餐30%，午餐40%，晚餐30%）

请严格按照以下JSON格式返回，不要包含任何多余文字：
{
  "goal": "${goalDescription}",
  "targetCalories": ${Math.round(targetCalories)},
  "userInfo": {
    "bmr": ${Math.round(bmr)},
    "tdee": ${Math.round(tdee)},
    "weight": ${profile?.weight || 0},
    "height": ${profile?.height || 0}
  },
  "meals": {
    "breakfast": {
      "name": "早餐名称",
      "foods": ["食物1 份量", "食物2 份量", "食物3 份量"],
      "calories": 热量数值(整数),
      "protein": 蛋白质克数(整数),
      "carbs": 碳水克数(整数),
      "fat": 脂肪克数(整数)
    },
    "lunch": {
      "name": "午餐名称",
      "foods": ["食物1 份量", "食物2 份量", "食物3 份量"],
      "calories": 热量数值(整数),
      "protein": 蛋白质克数(整数),
      "carbs": 碳水克数(整数),
      "fat": 脂肪克数(整数)
    },
    "dinner": {
      "name": "晚餐名称",
      "foods": ["食物1 份量", "食物2 份量", "食物3 份量"],
      "calories": 热量数值(整数),
      "protein": 蛋白质克数(整数),
      "carbs": 碳水克数(整数),
      "fat": 脂肪克数(整数)
    }
  },
  "nutritionTips": ["营养建议1", "营养建议2", "营养建议3", "营养建议4"]
}`;

  const apiUrl = `${AI_API_BASE_URL}`;
  console.log("🤖 使用AI生成个性化推荐...");
  console.log("📡 推荐 API端点:", apiUrl);
  console.log("👤 用户信息: 身高", profile?.height, "cm, 体重", profile?.weight, "kg, 目标", goalDescription);
  
  const startTime = Date.now();
  const response = await fetchFn(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "glm-4.6",
      messages: [
        {
          role: "system",
          content: "你是一名专业的营养师，擅长根据用户的身体状况制定个性化饮食计划。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      stream: false,
    }),
  });

  const data = await response.json();
  const elapsed = Date.now() - startTime;
  console.log(`✅ AI 推荐 API 请求完成, 耗时: ${elapsed}ms (${(elapsed/1000).toFixed(1)}秒), 状态码: ${response.status}`);
  
  if (!response.ok) {
    console.error("❌ AI 推荐 API 错误响应:", data);
    throw new Error(
      data.error?.message || `AI 推荐调用失败 (状态码: ${response.status})`
    );
  }

  const content = data.choices?.[0]?.message?.content;
  console.log("📄 AI 推荐返回内容:", content);
  
  if (typeof content !== "string") {
    throw new Error("AI推荐返回内容格式异常");
  }

  try {
    return parseJSONSafe(content);
  } catch (e) {
    console.error("❌ AI推荐 JSON解析失败:", e);
    throw new Error(
      "AI推荐返回的JSON格式错误: " +
        (typeof content === "string" ? content.substring(0, 200) : String(content))
    );
  }
}

// 推荐缓存 (简单的内存缓存,5分钟有效期)
const recommendationCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

// AI智能推荐API端点
app.post("/api/ai/meal-recommendation", authenticateToken, async (req, res) => {
  try {
    const { goal } = req.body;

    console.log("📝 收到AI推荐请求, 目标:", goal, "用户ID:", req.user.userId);

    if (!goal) {
      return res.status(400).json({ error: "请提供目标类型" });
    }

    // 获取用户健康档案
    const profile = await HealthProfile.findOne({ userId: req.user.userId });

    if (!profile || !profile.height || !profile.weight || !profile.age) {
      return res.status(400).json({ 
        error: "请先完善健康档案",
        message: "需要填写身高、体重、年龄等信息才能生成个性化推荐"
      });
    }

    // 检查缓存
    const cacheKey = `${req.user.userId}_${goal}_${profile.height}_${profile.weight}_${profile.age}`;
    const cached = recommendationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("✨ 使用缓存的推荐结果");
      return res.json({
        success: true,
        recommendation: cached.data,
        cached: true
      });
    }

    // 检查API密钥配置
    if (!API_KEY) {
      console.error("❌ 未检测到API密钥");
      return res.status(500).json({
        error: "未配置AI API密钥。请在.env文件中设置API_KEY",
      });
    }

    const recommendation = await generateMealRecommendationWithAI(profile, goal);
    console.log("✅ AI推荐生成完成");

    // 保存到缓存
    recommendationCache.set(cacheKey, {
      data: recommendation,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      recommendation: recommendation,
    });
  } catch (error) {
    console.error("❌ AI推荐错误详情:");
    console.error("错误消息:", error.message);
    console.error("错误堆栈:", error.stack);

    let errorMessage = error.message || "AI推荐失败，请检查API配置或稍后重试";

    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      errorMessage = "API密钥无效，请检查.env文件中的API_KEY配置";
    } else if (error.message.includes("429") || error.message.includes("rate limit")) {
      errorMessage = "API调用频率过高，请稍后再试";
    } else if (error.message.includes("network") || error.message.includes("fetch")) {
      errorMessage = "网络连接失败，请检查网络连接";
    } else if (error.message.includes("JSON")) {
      errorMessage = "AI返回格式错误，请重试";
    }

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// AI营养计算API端点
app.post("/api/ai/calculate-nutrition", authenticateToken, async (req, res) => {
  try {
    const { foodDescription } = req.body;

    console.log("📝 收到AI营养计算请求:", foodDescription);
    console.log("🔑 API配置检查:", {
      hasAPIKey: !!API_KEY,
      apiBaseUrl: AI_API_BASE_URL,
    });

    if (!foodDescription || foodDescription.trim().length === 0) {
      return res.status(400).json({ error: "请提供食物描述" });
    }

    // 检查API密钥配置
    if (!API_KEY) {
      console.error("❌ 未检测到API密钥");
      return res.status(500).json({
        error: "未配置AI API密钥。请在.env文件中设置API_KEY",
      });
    }

    const nutrition = await calculateNutritionWithAI(foodDescription);
    console.log("✅ AI返回结果:", nutrition);

    // 验证返回的数据
    if (!nutrition || !nutrition.name || nutrition.calories === undefined) {
      console.error("❌ AI返回数据格式不正确:", nutrition);
      return res.status(500).json({
        error: "AI返回的数据格式不正确，请重试",
      });
    }

    res.json({
      success: true,
      nutrition: {
        name: nutrition.name,
        calories: parseFloat(nutrition.calories) || 0,
        protein: parseFloat(nutrition.protein) || 0,
        fat: parseFloat(nutrition.fat) || 0,
        carbs: parseFloat(nutrition.carbs) || 0,
        fiber: parseFloat(nutrition.fiber) || 0,
        portion: parseFloat(nutrition.portion) || 100,
      },
    });
  } catch (error) {
    console.error("❌ AI营养计算错误详情:");
    console.error("错误消息:", error.message);
    console.error("错误堆栈:", error.stack);

    // 提供更详细的错误信息
    let errorMessage = error.message || "AI计算失败，请检查API配置或稍后重试";

    // 检查常见错误
    if (
      error.message.includes("401") ||
      error.message.includes("Unauthorized")
    ) {
      errorMessage = "API密钥无效，请检查.env文件中的API_KEY配置";
    } else if (
      error.message.includes("429") ||
      error.message.includes("rate limit")
    ) {
      errorMessage = "API调用频率过高，请稍后再试";
    } else if (
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      errorMessage = "网络连接失败，请检查网络连接";
    } else if (error.message.includes("JSON")) {
      errorMessage = "AI返回格式错误，请重试";
    }

    res.status(500).json({
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn("⚠️  未检测到AI API密钥，AI营养计算功能将不可用");
    console.warn("   请在.env文件中设置 API_KEY");
  } else {
    console.log(`✅ AI API配置成功`);
    console.log(`   API端点: ${AI_API_BASE_URL}`);
    console.log(`   使用密钥: API_KEY`);
  }
});

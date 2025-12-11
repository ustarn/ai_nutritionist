# AI营养计算功能配置说明

## 功能说明

AI营养计算功能可以自动识别您输入的食物描述，并计算其营养信息（热量、蛋白质、脂肪、碳水化合物等）。

## AI API配置

使用自定义AI API端点，兼容OpenAI API格式。

## 配置步骤

### 1. 获取API密钥

从您的AI服务提供商获取API密钥。

### 2. 配置环境变量

在 `backend` 目录下创建或编辑 `.env` 文件：

```env
# MongoDB连接
MONGODB_URI=mongodb://localhost:27017/nutrition_db

# JWT密钥
JWT_SECRET=your-secret-key-here

# 服务器端口
PORT=3000

# AI API配置
API_KEY=your-api-key-here
AI_API_BASE_URL=https://open.bigmodel.cn/api/paas/v4
```

**注意：** 
- `API_KEY` 是必填项，用于API认证
- `AI_API_BASE_URL` 可选，默认为 `https://open.bigmodel.cn/api/paas/v4`
- 如果您的API端点不同，可以修改 `AI_API_BASE_URL`

### 3. 安装依赖（如果需要）

如果您的Node.js版本低于18，需要安装 `node-fetch`:

```bash
cd backend
npm install node-fetch
```

Node.js 18+ 版本已内置 `fetch`，无需安装。

### 4. 重启服务器

配置完成后，重启后端服务器：

```bash
cd backend
npm start
```

## 使用方法

1. 在"饮食记录"页面，输入食物名称和份量（例如："鸡胸肉 150g" 或 "一碗白米饭"）
2. 点击"🤖 AI识别"按钮
3. AI会自动识别并填充营养信息
4. 确认信息无误后，点击"添加记录"

## 示例输入

- "鸡胸肉 150g"
- "一碗白米饭"
- "一个苹果"
- "200ml牛奶"
- "三文鱼 120g"
- "全麦面包 2片"

## 注意事项

1. 确保API密钥正确配置
2. API调用会产生费用（根据提供商定价）
3. 如果识别失败，请检查网络连接或API配置
4. 建议在输入中包含份量信息，以获得更准确的结果

## 故障排除

### 错误: "未配置AI API密钥"
- 检查 `.env` 文件是否存在
- 确认API密钥已正确设置
- 重启服务器

### 错误: "AI计算失败"
- 检查API密钥是否有效
- 确认账户余额充足
- 检查网络连接
- 确认API端点地址正确

### 错误: "需要Node.js 18+或安装node-fetch包"
- 升级Node.js到18+版本，或
- 运行 `npm install node-fetch`


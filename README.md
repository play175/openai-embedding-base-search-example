# openai-embedding-base-search-example

基于 OpenAI 的 embedding 接口和 GPT3.5接口实现的文章搜索实例（当然，大部分代码是通过 ChatGPT 给的，我只做了一些改动封装）

PS.代码只是简单示例，实际使用应该用向量数据库存储文章的 embedding 数据

## 流程

+ 为所有文章生成 embedding 数据（只需要做一次）
+ 为用户的输入生成 embedding 数据
+ 通过相似度算法，找出与用户输入相似度高的前 3 篇文章
+ 分割 这 3 篇文章的所有段落
+ 分别把用户输入和文章段落给到 GPT 模型，如果模型给出肯定回答，则把段落返回输出

## 运行

- 需要安装 nodejs v18+
- 在本项目根目录创建 `.env` 文件，设置 OpenAPI API KEY 环境变量
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#如果需要使用代理访问，请提供下面的环境变量
#https_proxy=http://127.0.0.1:1080
```
- 安装依赖 `npm install`
- 运行 `npm run dev`

## 更多参考

- 基于embedding的领域知识问答：https://github.com/openai/openai-cookbook/blob/main/examples/Question_answering_using_embeddings.ipynb
- 生成 OpenAI API KEY：https://platform.openai.com/account/api-keys

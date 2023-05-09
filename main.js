
import prompt from 'prompt'
import dotEnv from 'dotenv'
import invokeOpenAIApi from './openai.js'

/**
 * openai embedding-base searching demo
 * @author github/play175
 */

(async () => {

    dotEnv.config()

    if (!process.env.OPENAI_API_KEY) {
        console.error('please config the env: OPENAI_API_KEY')
        process.exit(-1)
    }

    const articles = [
        {
            title: '四元数与空间旋转',
            text: '单位四元数（Unit quaternion）可以用于表示三维空间里的旋转[1]。它与常用的另外两种表示方式（三维正交矩阵和欧拉角）是等价的，但是避免了欧拉角表示法中的万向锁问题。比起三维正交矩阵表示，四元数表示能够更方便地给出旋转的转轴与旋转角。'
        },
        {
            title: '实射影空间',
            text: '数学中，实射影空间（real projective space），记作 RPn，是 Rn+1 中的直线组成的射影空间。它是一个 n 维紧光滑流形，也是格拉斯曼流形的一个特例。'
        },
        {
            title: '欧拉示性数',
            text: '在代数拓扑中，欧拉示性数（英语：Euler characteristic）是一个拓扑不变量[注 1]，对于一大类拓扑空间有定义。'
        }
    ];

    // create all articles embedding data (once)
    for (const article of articles) {

        const res = await createEmbedding(article.title + '\n' + article.text);
        if (res && res.statusCode === 200 && res.data && res.data.data[0] && res.data.data[0].object === 'embedding' && res.data.data[0].embedding) {
            article.embedding = res.data.data[0].embedding;
        } else {
            console.error('embedding api failed', res.statusMessage)
            return
        }
    }

    prompt.start();
    prompt.get(['prompt'], async (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        const query = result['prompt']

        if (!query) {
            console.log('please input prompt first.')
            return
        }

        // create query embedding data
        let queryEmbedding
        const res = await createEmbedding(query);
        if (res && res.statusCode === 200 && res.data && res.data.data[0] && res.data.data[0].object === 'embedding' && res.data.data[0].embedding) {
            queryEmbedding = res.data.data[0].embedding;
        } else {
            console.error('query embedding api failed', res.statusMessage)
            return
        }

        // similarity sort
        const articleScores = [];
        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            const similarity = cosineSimilarity(queryEmbedding, articles[i].embedding);
            articleScores.push({ title: article.title, score: similarity });
        }
        articleScores.sort((a, b) => b.score - a.score);

        // paragraphs search
        console.log(`Top 3 articles about "${query}":`);
        for (let i = 0; i < 3 && i < articleScores.length; i++) {
            console.log(`${i + 1}. ${articleScores[i].title} (Score:${articleScores[i].score.toFixed(4)})`);

            const articleIndex = articles.findIndex(article => article.title === articleScores[i].title);
            // split to paragraphs (can be cached)
            const paragraphs = articles[articleIndex].text.split('\n');
            const matchingParagraphs = [];
            for (const paragraph of paragraphs) {
                let completion = ''
                const prompt = `Please output "true" if the above information are related to "${query}", otherwise please output "false".`
                const res = await chat([{ role: "user", content: paragraph }, { role: "user", content: prompt }]);
                if (res.statusCode !== 200) {
                    console.log('chat api failed', res.statusMessage);
                    return
                }
                completion = (res.data.choices[0].message.content);
                // console.log({ completion })
                if (completion.includes('true') || completion.includes('True')) {
                    matchingParagraphs.push(paragraph);
                }
            }

            console.log('Matching paragraphs:');
            if (matchingParagraphs.length === 0) {
                console.log('None');
            } else {
                for (let j = 0; j < matchingParagraphs.length; j++) {
                    console.log(`(${j + 1}) ${matchingParagraphs[j]}`);
                }
            }
        }
    });

    function createEmbedding(text) {
        return invokeOpenAIApi({
            path: '/embeddings', data: {
                model: "text-embedding-ada-002",
                input: text,
            },
            apiKey: process.env.OPENAI_API_KEY
        })
    }

    function chat(messages) {
        return invokeOpenAIApi({
            path: '/chat/completions'
            , data: {
                model: "gpt-3.5-turbo",
                messages,
            },
            apiKey: process.env.OPENAI_API_KEY
        })
    }

    function cosineSimilarity(vector1, vector2) {
        if (!(Array.isArray(vector1) && Array.isArray(vector2))) {
            console.error('cosineSimilarity args error')
            return 0
        }
        const dotProduct = vector1.reduce((sum, value, i) => sum + (value * vector2[i]), 0);
        const magnitude1 = Math.sqrt(vector1.reduce((sum, value) => sum + (value ** 2), 0));
        const magnitude2 = Math.sqrt(vector2.reduce((sum, value) => sum + (value ** 2), 0));
        return dotProduct / (magnitude1 * magnitude2);
    }

})()
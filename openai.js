
import HttpsProxyAgent from "https-proxy-agent"
import { URL } from 'node:url'
import https from 'node:https'

/**
 * openai API wrapper
 * @author github/play175
 */

let staticHttpsAgent = null

export default function invokeOpenAIApi({ path, data, apiKey, base = 'https://api.openai.com/v1', httpsAgent = null }) {
    return new Promise(resolve => {

        const options = {
            method: 'POST',
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        }

        if (httpsAgent) {
            options.agent = httpsAgent
        } else {
            if (process.env.https_proxy) {
                if (!staticHttpsAgent) {
                    const proxyUrl = new URL(process.env.https_proxy)
                    console.log('invokeOpenAIApi use https_proxy', process.env.https_proxy)
                    staticHttpsAgent = new HttpsProxyAgent({ host: proxyUrl.hostname, port: Number(proxyUrl.port) })
                }
            }
            if (staticHttpsAgent) {
                options.agent = staticHttpsAgent
            }
        }

        const req = https.request(base + path, options, (res) => {
            let output = ''
            res.on('data', (d) => {
                output += d
            });
            res.on('end', () => {
                let jsonData = null
                let statusMessage = res.statusMessage
                if (output) {
                    try {
                        jsonData = JSON.parse(output)
                    } catch (e) {
                        resolve({ statusCode: 500, statusMessage: 'response parse failed:' + e.message, data: jsonData })
                        return
                    }
                }
                if (res.statusCode !== 200 && jsonData && jsonData.error && jsonData.error.message) {
                    statusMessage = jsonData.error.message
                }
                resolve({ statusCode: res.statusCode, statusMessage, data: jsonData })
            });
        });

        req.on('error', (e) => {
            resolve({ statusCode: 400, statusMessage: e.message })
        });
        req.end(JSON.stringify(data));
    })
}

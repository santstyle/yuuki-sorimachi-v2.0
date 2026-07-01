const axios = require('axios');
const path = require('path');
const prisma = require('./db');

const API_CONFIGS = {
    GROQ: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.3-70b-versatile',
        free: true
    },
    CEREBRAS: {
        url: 'https://api.cerebras.ai/v1/chat/completions',
        apiKey: process.env.CEREBRAS_API_KEY,
        model: 'llama-3.3-70b',
        free: true
    },
    SAMBANOVA: {
        url: 'https://api.sambanova.ai/v1/chat/completions',
        apiKey: process.env.SAMBANOVA_API_KEY,
        model: 'Meta-Llama-3.3-70B-Instruct',
        free: true
    },
    CLOUDFLARE: {
        url: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
        apiKey: process.env.CLOUDFLARE_API_TOKEN,
        model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        free: true,
        useCloudflareFormat: true
    },
    OPENROUTER: {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: process.env.OPENROUTER_API_KEY,
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        free: true
    },
    DEEPSEEK: {
        url: 'https://api.deepseek.com/chat/completions',
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: 'deepseek-chat',
        free: true
    },
    GEMINI: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.0-flash',
        free: true,
        useGeminiFormat: true
    },
    MISTRAL: {
        url: 'https://api.mistral.ai/v1/chat/completions',
        apiKey: process.env.MISTRAL_API_KEY,
        model: 'mistral-small-latest',
        free: true
    },
    OPENAI: {
        url: 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o',
        free: false
    }
};

const FALLBACK_ORDER = ['GROQ', 'GEMINI', 'MISTRAL', 'OPENROUTER', 'CEREBRAS', 'CLOUDFLARE', 'SAMBANOVA', 'DEEPSEEK', 'OPENAI'];

const errorLog = [];
const MAX_ERROR_LOG = 50;

function logError(provider, errorType, errorMessage, userId = null) {
    const entry = {
        timestamp: new Date().toISOString(),
        provider,
        errorType,
        errorMessage,
        userId
    };
    errorLog.push(entry);
    if (errorLog.length > MAX_ERROR_LOG) {
        errorLog.shift();
    }
    return entry;
}

function getErrorLog() {
    return [...errorLog];
}

function getRecentErrors(count = 10) {
    return errorLog.slice(-count);
}

async function logAiUsage(provider, model, success, responseTime, userId = null, error = null, userName = null) {
    try {
        await prisma.aiLog.create({
            data: {
                provider,
                model: model || null,
                success,
                responseTime,
                userId: userId || null,
                userName: userName || null,
                error: error || null,
            }
        });
    } catch (e) {
        // Silent fail - don't break AI if logging fails
    }
}

async function cleanupOldAiLogs(days = 30) {
    try {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const result = await prisma.aiLog.deleteMany({
            where: { createdAt: { lt: cutoff } }
        });
        if (result.count > 0) {
            console.log(`[AI Cleanup] Deleted ${result.count} logs older than ${days} days`);
        }
    } catch (e) {
        console.error('[AI Cleanup] Error:', e.message);
    }
}

async function callAI(messages, options = {}) {
    const {
        fallbackOrder = FALLBACK_ORDER,
        temperature = 0.7,
        timeout = 30000,
        maxTokens = null,
        userId = null,
        userName = null,
        maxRetries = 1
    } = options;

    const failedApis = [];
    let lastError = null;
    const startTime = Date.now();

    for (const apiName of fallbackOrder) {
        const config = API_CONFIGS[apiName];
        if (!config || !config.apiKey) continue;

        let retries = 0;
        let success = false;

        while (retries <= maxRetries && !success) {
            try {
                let response;
                let content;

                if (config.useGeminiFormat) {
                    const url = config.url
                        .replace('{model}', config.model)
                        .replace('{apiKey}', config.apiKey);
                    const geminiMessages = messages.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    }));
                    response = await axios.post(url, { contents: geminiMessages }, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout
                    });
                    content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                } else if (config.useCloudflareFormat) {
                    response = await axios.post(config.url, { messages }, {
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout
                    });
                    content = response.data?.result?.response;
                } else {
                    const body = {
                        model: config.model,
                        messages,
                        temperature,
                        stream: false
                    };
                    if (maxTokens) body.max_tokens = maxTokens;

                    response = await axios.post(
                        config.url,
                        body,
                        {
                            headers: {
                                'Authorization': `Bearer ${config.apiKey}`,
                                'Content-Type': 'application/json',
                                'User-Agent': 'Yuuki-Bot'
                            },
                            timeout
                        }
                    );
                    content = response.data?.choices?.[0]?.message?.content;
                }

                if (content) {
                    const responseTime = Date.now() - startTime;
                    logAiUsage(apiName, config.model, true, responseTime, userId, null, userName).catch(() => {});
                    return { content, provider: apiName };
                }
            } catch (error) {
                const statusCode = error?.response?.status;
                const errMsg = error?.message || '';
                const isRateLimit = statusCode === 429 || /rate_limit|Rate limit/i.test(errMsg);
                const isTimeout = /timeout|ETIMEDOUT|ECONNABORTED/i.test(errMsg);
                const isNetwork = /ENOTFOUND|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN|socket hang up|fetch failed/i.test(errMsg);
                const canRetry = (isTimeout || isNetwork) && retries < maxRetries;

                if (canRetry) {
                    retries++;
                    console.log(`[AI] ${apiName} retry ${retries}/${maxRetries}...`);
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }

                let errorType = 'unknown';
                if (isRateLimit) errorType = 'rate_limit';
                else if (isTimeout) errorType = 'timeout';
                else if (isNetwork) errorType = 'network';
                else if (statusCode) errorType = `http_${statusCode}`;

                const errorDetail = isRateLimit ? 'limit' : (statusCode || errorType);
                failedApis.push(`${apiName} (${errorDetail})`);
                logError(apiName, errorType, errMsg, userId);
                console.error(`[AI] ${apiName} gagal: ${error.message}`);
                lastError = error;
                break;
            }
        }
    }

    const errorMsg = `Semua API gagal: ${failedApis.join(', ')}`;
    logError('ALL_FAILED', 'all_providers', errorMsg, userId);
    logAiUsage('ALL_FAILED', null, false, Date.now() - startTime, userId, errorMsg, userName).catch(() => {});
    throw new Error(errorMsg);
}

module.exports = { API_CONFIGS, FALLBACK_ORDER, callAI, getErrorLog, getRecentErrors, logAiUsage, cleanupOldAiLogs };

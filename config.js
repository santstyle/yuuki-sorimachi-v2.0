require('dotenv').config();

// Daftar API gratis
global.APIs = {
    xteam: 'https://api.xteam.xyz',
    dzx: 'https://api.dhamzxploit.my.id',
    lol: 'https://api.lolhuman.xyz',
    violetics: 'https://violetics.pw',
    neoxr: 'https://api.neoxr.my.id',
    zenzapis: 'https://zenzapis.xyz',
    akuari: 'https://api.akuari.my.id',
    akuari2: 'https://apimu.my.id',
    nrtm: 'https://fg-nrtm.ddns.net',
    bg: 'http://bochil.ddns.net',
    fgmods: 'https://api-fgmods.ddns.net',
    // API baru
    chocomilk: 'https://chocomilk.amira.us.kg',
    cuki: 'https://api.cuki.biz.id',
    deline: 'https://api.deline.web.id',
    faaa: 'https://api-faa.my.id',
    kuroneko: 'https://api.danzy.web.id',
    lexcode: 'https://api.lexcode.biz.id',
    nekolabs: 'https://rynekoo-api.hf.space',
    neo: 'https://www.neoapis.xyz',
    nexray: 'https://api.nexray.eu.cc',
    omegatech: 'https://omegatech-api.dixonomega.tech',
    sanka: 'https://www.sankavolereii.my.id',
    siputzx: 'https://api.siputzx.my.id',
    vreden: 'https://api.vreden.my.id',
    yp: 'https://api.yupra.my.id',
    zenzxz: 'https://api.zenzxz.my.id'
};

// Populate APIKeys from environment variables
global.APIKeys = {};
for (const [key, url] of Object.entries(global.APIs)) {
    const envVarName = `${key.toUpperCase()}_API_KEY`.replace(/[^A-Z0-9]/g, '_');
    if (process.env[envVarName]) {
        global.APIKeys[url] = process.env[envVarName];
    }
}

// Fungsi untuk membuat URL API
function createUrl(apiNameOrURL, endpoint, params = {}, apiKeyParamName) {
    try {
        const api = global.APIs[apiNameOrURL];
        if (!api) {
            const url = new URL(apiNameOrURL);
            apiNameOrURL = url;
        }

        const queryParams = new URLSearchParams(params);
        
        // Ambil key dari environment variable jika ada
        if (apiKeyParamName && api) {
            const envVarName = `${apiNameOrURL.toUpperCase()}_API_KEY`.replace(/[^A-Z0-9]/g, '_');
            const key = process.env[envVarName] || global.APIKeys[api];
            if (key) {
                queryParams.set(apiKeyParamName, key);
            }
        }

        const baseURL = api ? api : apiNameOrURL.origin;
        const apiUrl = new URL(endpoint, baseURL);
        apiUrl.search = queryParams.toString();

        return apiUrl.toString();
    } catch (error) {
        console.error(`Error creating URL: ${error.message}`);
        return null;
    }
}

function listUrl() {
    return global.APIs;
}

module.exports = {
    WARN_COUNT: 3,
    APIs: global.APIs,
    APIKeys: global.APIKeys, // Sekarang diisi dari .env
    createUrl,
    listUrl
};
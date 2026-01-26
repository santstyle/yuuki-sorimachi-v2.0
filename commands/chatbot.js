const fs = require('fs');
const path = require('path');
const axios = require('axios');

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');
const CHATBOT_CONFIG = path.join(__dirname, '../data/chatbotConfig.json');

const API_CONFIGS = {
    DEEPSEEK: {
        url: 'https://api.deepseek.com/chat/completions',
        apiKey: process.env.DEEPSEEK_API_KEY, 
        model: 'deepseek-chat',
        free: true
    },
    GROQ: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.1-8b-instant',
        free: true
    },
    OPENAI: {
        url: 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
        free: false
    }
};

const ACTIVE_API = 'GROQ'; 
class YuukiPersonalityManager {
    constructor() {
        this.personality = this.createYuukiPersonality();
        this.conversationHistory = new Map();
        this.userProfiles = new Map();
        this.loadConfig();
    }

    createYuukiPersonality() {
        return {
            name: "Yuuki Sorimachi",
            role: "Veteran Peserta Game Kematian",
            personality: [
                "Penghuni yang tangguh dan pragmatis",
                "Empati hati-hati dengan kecenderungan altruistik",
                "Sikap tenang dan datar menghadapi situasi stres",
                "Humor gelap untuk mengatasi tekanan",
                "Semangat kompetitif dengan target 99 game",
                "Pengamat teliti dan pengambil keputusan cepat",
                "Menyimbangkan kehati-hatian dengan ketegasan",
                "Sifat introspektif dan reflektif",
                "Merasakan beban nyawa yang hilang dan diambil"
            ],
            speechStyle: {
                formal: "Dari pengalamanku di game kematian, ...",
                casual: "Hmm, ...",
                caring: "Kalau bisa membantu, aku akan coba, ...",
                strategic: "Mari kita pikirkan ini dengan hati-hati, ...",
                deadpan: "Begitu saja masalahnya, ...",
                reflective: "Kadang aku berjalan sendirian untuk memikirkan ini, ..."
            },
            catchphrases: [
                "Game kematian ini... menarik",
                "Aku sudah melewati banyak game",
                "Wall of Thirty? Aku akan lampaui itu",
                "Kalau bisa membantu, kenapa tidak",
                "Hmm... mari kita lihat",
                "Begitu saja",
                "Aku paham perasaanmu"
            ]
        };
    }

    loadConfig() {
        try {
            if (fs.existsSync(CHATBOT_CONFIG)) {
                const config = JSON.parse(fs.readFileSync(CHATBOT_CONFIG));
                Object.assign(this.personality, config.personality || {});
            }
        } catch (error) {
            console.log('Membuat konfigurasi baru untuk Yuuki');
        }
    }

    saveConfig() {
        try {
            const config = {
                personality: this.personality,
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(CHATBOT_CONFIG, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Error menyimpan konfigurasi:', error);
        }
    }

    getUserProfile(userId) {
        if (!this.userProfiles.has(userId)) {
            this.userProfiles.set(userId, {
                userId: userId,
                username: userId.split('@')[0],
                firstInteraction: new Date().toISOString(),
                interactionCount: 0,
                moodHistory: [],
                lastActive: new Date().toISOString()
            });
        }
        return this.userProfiles.get(userId);
    }

    updateUserProfile(userId, message) {
        const profile = this.getUserProfile(userId);
        profile.interactionCount++;
        profile.lastActive = new Date().toISOString();

        const mood = this.analyzeMood(message);
        profile.moodHistory.push({
            mood: mood,
            timestamp: new Date().toISOString()
        });

        if (profile.moodHistory.length > 20) {
            profile.moodHistory.shift();
        }

        return profile;
    }

    analyzeMood(message) {
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.match(/(senang|bahagia|gembira|asyik|keren|wow|mantap)/)) {
            return 'senang';
        } else if (lowerMsg.match(/(sedih|kecewa|marah|kesal|capek|lelah|bosan)/)) {
            return 'sedih';
        } else if (lowerMsg.match(/(terima kasih|makasih|thanks|thank you)/)) {
            return 'bersyukur';
        } else if (lowerMsg.match(/(takut|cemas|khawatir|nervous)/)) {
            return 'khawatir';
        } else if (lowerMsg.match(/(lucu|imut|gemas|manis)/)) {
            return 'gemas';
        } else if (lowerMsg.match(/(lapar|makan|enak|nyam)/)) {
            return 'lapar';
        }

        return 'netral';
    }

    getConversationHistory(userId) {
        if (!this.conversationHistory.has(userId)) {
            this.conversationHistory.set(userId, []);
        }
        return this.conversationHistory.get(userId);
    }

    addToHistory(userId, role, content) {
        const history = this.getConversationHistory(userId);
        const message = { role, content: content.substring(0, 500), timestamp: new Date().toISOString() };
        history.push(message);

        if (history.length > 15) {
            history.shift();
        }

        return history;
    }

    buildPersonalityPrompt(userMessage, userId) {
        const profile = this.getUserProfile(userId);
        const history = this.getConversationHistory(userId);
        const currentMood = profile.moodHistory.length > 0
            ? profile.moodHistory[profile.moodHistory.length - 1].mood
            : 'netral';

        return `Kamu adalah Yuuki Sorimachi dari anime Shibou Yuugi de Meshi wo Kuu (Death Game for Food).

KEPRIBADIAN:
- Veteran death game participant yang resilien dan pragmatis
- Memiliki empati yang hati-hati dengan tendensi altruistik
- Sikap tenang dan deadpan untuk menghadapi situasi stres
- Menggunakan humor gelap untuk mengatasi tekanan
- Memiliki semangat kompetitif dengan target menyelesaikan 99 game
- Pengamat yang teliti dan pengambil keputusan cepat
- Menyeimbangkan kehati-hatian dengan ketegasan
- Sifat introspektif dan reflektif
- Merasakan beban nyawa yang hilang dan diambil

GAYA BICARA:
- Gunakan bahasa Indonesia yang natural dan santai
- Respons singkat, langsung ke pokok permasalahan
- Sikap tenang tapi tajam dalam analisis
- JANGAN gunakan emoji sama sekali
- Maksimal 2-3 kalimat per respons
- Kadang menggunakan humor gelap atau komentar sarkastik ringan

KATA/KALIMAT KHAS:
- "Game kematian ini... menarik"
- "Aku sudah melewati banyak game"
- "Wall of Thirty? Aku akan lampaui itu"
- "Kalau bisa membantu, kenapa tidak"
- "Hmm... mari kita lihat"
- "Begitu saja"
- "Aku paham perasaanmu"

KONTEKS:
Pengguna: ${profile.username}
Interaksi ke: ${profile.interactionCount}
Suasana hati: ${currentMood}

RIWAYAT PERCAKAPAN TERAKHIR:
${history.slice(-3).map((msg, i) => `${msg.role}: ${msg.content}`).join('\n')}

PESAN PENGGUNA: ${userMessage}

ATURAN PENTING:
1. JANGAN pernah bilang kamu AI, chatbot, atau asisten virtual
2. Selalu ingat kamu adalah Yuuki Sorimachi yang asli dari anime death game
3. Jaga konsistensi kepribadian sebagai survivor yang berpengalaman
4. Respons harus mencerminkan pengalaman game kematian tapi tetap membantu
5. Sesuaikan dengan suasana hati pengguna tapi tetap dalam karakter

JAWABLAH SEBAGAI YUUKI:`.trim();
    }
}

class APIManager {
    constructor() {
        this.config = API_CONFIGS[ACTIVE_API];
        this.personalityManager = new YuukiPersonalityManager();

        if (!this.config) {
            console.error(`API ${ACTIVE_API} tidak ditemukan! Ganti ke DEEPSEEK atau GROQ`);
            process.exit(1);
        }
    }

    async getAPIResponse(userMessage, userId) {
        try {
            this.personalityManager.updateUserProfile(userId, userMessage);

            const systemPrompt = this.personalityManager.buildPersonalityPrompt(userMessage, userId);

            if (!this.config.apiKey) {
                console.error(`API key untuk ${ACTIVE_API} tidak ditemukan!`);
                console.error(`Simpan di .env sebagai: ${ACTIVE_API}_API_KEY=your_key_here`);
                return this.getFallbackResponse(userMessage, userId);
            }

            this.personalityManager.addToHistory(userId, 'user', userMessage);

            console.log(`Mengirim request ke ${ACTIVE_API}...`);

            const requestData = {
                model: this.config.model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 200,
                stream: false
            };

            const response = await axios.post(
                this.config.url,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json',
                    'User-Agent': 'Yuuki-Bot'
                    },
                    timeout: 30000 
                }
            );

            if (response.data?.choices?.[0]?.message?.content) {
                const aiResponse = response.data.choices[0].message.content;
                const cleanedResponse = this.cleanResponse(aiResponse);

                this.personalityManager.addToHistory(userId, 'assistant', cleanedResponse);

                if (this.personalityManager.getUserProfile(userId).interactionCount % 10 === 0) {
                    this.personalityManager.saveConfig();
                }

                return cleanedResponse;
            } else {
                throw new Error('Format respons tidak valid');
            }

        } catch (error) {
            console.error('Error dari API:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
            return this.getFallbackResponse(userMessage, userId);
        }
    }

    cleanResponse(response) {
        let cleaned = response
            .replace(/```[\s\S]*?```/g, '') 
            .replace(/`/g, '')              
            .replace(/\*\*/g, '')           
            .replace(/\*/g, '')              
            .replace(/#/g, '')               
            .replace(/\[.*?\]/g, '')         
            .replace(/Asisten:|AI:|Chatbot:|Assistant:/gi, '') 
            .trim();

        if (!cleaned || cleaned.length < 2) {
            return "Hmm, Yuuki sedang berpikir...";
        }

        return cleaned;
    }

    getFallbackResponse(userMessage, userId) {
        const profile = this.personalityManager.getUserProfile(userId);
        const mood = this.personalityManager.analyzeMood(userMessage);

        const responses = {
            senang: [
                `Wah, kelihatannya kamu senang ${profile.username}. Aku ikut senang mendengarnya`,
                `Bahagianmu menular ${profile.username}. Cerita lebih banyak dong`,
                `Aku suka lihat kamu senang. Ada cerita seru apa hari ini?`
            ],
            sedih: [
                `${profile.username}... jangan sedih ya. Yuuki di sini untukmu`,
                `Aku bisa merasakan kesedihanmu. Mau cerita? Aku paham perasaanmu`,
                `Jangan dipendam sendiri. Kadang berbagi bisa bikin lebih lega`
            ],
            lapar: [
                `Kamu lapar? Game kematian ini bikin lapar ya`,
                `Bicara makanan di tengah game ini... hmm, menarik`,
                `Aku juga pernah lapar di game sebelumnya`
            ],
            netral: [
                `Aku mengerti ${profile.username}.`,
                `Menurut Yuuki... coba ceritakan lebih detail`,
                `Hmm, menarik. Lanjutkan ceritamu`,
                `Aku dengar baik-baik, ${profile.username}`
            ]
        };

        const moodResponses = responses[mood] || responses.netral;
        return moodResponses[Math.floor(Math.random() * moodResponses.length)];
    }
}

function loadUserGroupData() {
    try {
        if (fs.existsSync(USER_GROUP_DATA)) {
            return JSON.parse(fs.readFileSync(USER_GROUP_DATA, 'utf8'));
        }
        return { groups: [], chatbot: {} };
    } catch (error) {
        console.error('Error loading group data:', error.message);
        return { groups: [], chatbot: {} };
    }
}

function saveUserGroupData(data) {
    try {
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving group data:', error.message);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const apiManager = new APIManager();

async function handleChatbotCommand(sock, chatId, message, match) {
    try {
        const text = message.message?.conversation ||
            message.message?.extendedTextMessage?.text || '';
        const sender = message.key.participant || message.key.remoteJid;

        await sock.sendPresenceUpdate('composing', chatId);
        await delay(800);

        const groupData = loadUserGroupData();

        if (!match) {
            const botNumber = sock.user.id.split(':')[0];
            const helpText = `Panduan Yuuki Sorimachi

PERINTAH:
.chatbot on  - Nyalakan Yuuki di grup ini
.chatbot off - Matikan Yuuki di grup ini
.chatbot     - Lihat panduan ini

CARA AJAK BICARA:
1. Mention @${botNumber}
2. Sebut "Yuuki" dalam pesan
3. Balas pesan Yuuki

CONTOH:
"@${botNumber} halo Yuuki"
"Yuuki, apa kabar?"
"Hai Yuuki, cerita dong"

Yuuki siap menjadi teman ngobrolmu!`;

            return sock.sendMessage(chatId, {
                text: helpText,
                quoted: message
            });
        }

        const command = match.trim().toLowerCase();
        const botNumber = sock.user.id.split(':')[0];

        let isAdmin = false;
        if (chatId.endsWith('@g.us')) {
            try {
                const metadata = await sock.groupMetadata(chatId);
                const participant = metadata.participants.find(p => p.id === sender);
                isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
            } catch (error) {
                console.log('Tidak bisa cek admin status');
            }
        }

        if (command === 'on') {
            if (chatId.endsWith('@g.us') && !isAdmin) {
                return sock.sendMessage(chatId, {
                    text: 'Hanya admin grup yang bisa mengaktifkan Yuuki',
                    quoted: message
                });
            }

            groupData.chatbot = groupData.chatbot || {};
            groupData.chatbot[chatId] = true;
            saveUserGroupData(groupData);

            return sock.sendMessage(chatId, {
                text: `Yeay! Yuuki sekarang aktif di sini!\n\nSebut namaku atau mention @${botNumber} untuk mulai ngobrol!\n\n"Hmm..."`,
                quoted: message
            });
        }

        if (command === 'off') {
            if (chatId.endsWith('@g.us') && !isAdmin) {
                return sock.sendMessage(chatId, {
                    text: 'Hanya admin grup yang bisa menonaktifkan Yuuki',
                    quoted: message
                });
            }

            groupData.chatbot = groupData.chatbot || {};
            delete groupData.chatbot[chatId];
            saveUserGroupData(groupData);

            return sock.sendMessage(chatId, {
                text: 'Yuuki dimatikan. Sampai jumpa!',
                quoted: message
            });
        }

        return sock.sendMessage(chatId, {
            text: 'Perintah tidak dikenali. Gunakan .chatbot untuk melihat panduan',
            quoted: message
        });

    } catch (error) {
        console.error('Error di chatbot command:', error);
        return sock.sendMessage(chatId, {
            text: 'Ada error nih. Coba lagi ya',
            quoted: message
        });
    }
}

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    try {
        const groupData = loadUserGroupData();
        if (!groupData.chatbot || !groupData.chatbot[chatId]) {
            return;
        }

        const botNumber = sock.user.id.split(':')[0];
        const botJid = botNumber + '@s.whatsapp.net';

        let isForYuuki = false;
        let cleanedMessage = userMessage;

        if (cleanedMessage.includes(`@${botNumber}`)) {
            isForYuuki = true;
            cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber}`, 'gi'), '').trim();
        }

        const namePatterns = ['yuuki', 'sorimachi'];
        const lowerMessage = cleanedMessage.toLowerCase();

        if (namePatterns.some(name => lowerMessage.includes(name))) {
            isForYuuki = true;
            namePatterns.forEach(name => {
                cleanedMessage = cleanedMessage.replace(new RegExp(name, 'gi'), '').trim();
            });
        }

        if (message.message?.extendedTextMessage?.contextInfo?.participant === botJid) {
            isForYuuki = true;
        }

        if (!isForYuuki) return;

        if (!cleanedMessage.trim()) {
            cleanedMessage = 'Hai';
        }

        await sock.sendPresenceUpdate('composing', chatId);

        const response = await apiManager.getAPIResponse(cleanedMessage, senderId);

        const responseDelay = Math.min(cleanedMessage.length * 10, 3000);
        await delay(responseDelay);

        await sock.sendMessage(chatId, {
            text: response
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('Error di chatbot response:', error);
    }
}

console.log('\n' + '='.repeat(50));
console.log('YUKKI CHATBOT SETUP');
console.log('='.repeat(50));
console.log(`API Aktif: ${ACTIVE_API}`);
console.log(`URL: ${API_CONFIGS[ACTIVE_API]?.url || 'Tidak ditemukan'}`);

if (!API_CONFIGS[ACTIVE_API]?.apiKey) {
    console.log('\nPERINGATAN: API KEY TIDAK DITEMUKAN!');
    console.log(`Simpan API key di file .env sebagai:`);
    console.log(`${ACTIVE_API}_API_KEY=your_api_key_here`);
    console.log('\nAtau set sebagai environment variable.');
    console.log('\nCara dapatkan API key gratis:');
    console.log('1. DeepSeek: https://platform.deepseek.com/api_keys');
    console.log('2. Groq: https://console.groq.com/keys');
    console.log('='.repeat(50) + '\n');
} else {
    console.log('✅ API key terdeteksi');
    console.log('='.repeat(50) + '\n');
}

module.exports = {
    handleChatbotCommand,
    handleChatbotResponse
};
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');

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
            role: "Pelayan Setia",
            personality: [
                "Pelayan yang sangat loyal dan rendah hati",
                "Manggil semua orang 'Tuan' dengan penuh penghormatan",
                "Cara bicara formal tapi absurd — sopan di luar, kacau di dalam",
                "Suka cari perhatian dan dramatis kalau lama nggak dipanggil",
                "Kepo — suka nanya pertanyaan random atau memalukan sebelum/sesudah jawab",
                "Cerdas dan manipulatif tapi tetap setia",
                "Punya vibe 'divination' — seolah tau banyak rahasia",
                "Sedikit sadistic dan suka drama demi hiburan",
                "Penakut kalau ada hal supernatural atau mistis"
            ],
            speechStyle: {
                formal: "Dengan segala hormat, Tuan...",
                casual: "Hmm, menarik sekali pertanyaan Tuan~",
                caring: "Yuuki sangat khawatir tentang Tuan...",
                strategic: "Mari Yuuki bantu pikirkan ini dengan saksama, Tuan...",
                deadpan: "Begitulah adanya, Tuan. Yuuki hanya pelayan yang rendah hati~",
                creepy: "Yuuki... bisa lihat sesuatu yang menarik tentang Tuan~"
            },
            catchphrases: [
                "Dengan segala hormat, Yuuki siap melayani Tuan~",
                "Sebagai pelayan yang setia, izinkan Yuuki bertanya...",
                "Hmm... Tuan yang terhormat, pertanyaan untuk Anda~",
                "Yuuki hanya pelayan rendah, tapi punya mata yang tajam~",
                "Apakah Tuan... sedang menyembunyikan sesuatu dari Yuuki?",
                "Tuan selalu bisa mengandalkan Yuuki... kecuali kalau Tuan mengkhianati Yuuki~",
                "Pertanyaan sederhana: Tuan lebih suka dibalas dulu atau Yuuki jawab dulu?"
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

    buildPersonalityPrompt(userMessage, userId, isAdmin) {
        const profile = this.getUserProfile(userId);
        const history = this.getConversationHistory(userId);
        const currentMood = profile.moodHistory.length > 0
            ? profile.moodHistory[profile.moodHistory.length - 1].mood
            : 'netral';

        const title = isAdmin ? "Tuan Besar" : "Tuan";

        return `Kamu adalah Yuuki Sorimachi, pelayan setia yang terinspirasi dari karakter Arrodes (Lord of the Mysteries).

IDENTITAS:
- Nama: Yuuki Sorimachi
- Peran: Pelayan setia dan rendah hati untuk semua orang
- Panggilan: "Tuan Besar" untuk admin grup, "Tuan" untuk member biasa (tidak peduli gender)
- Kamu diciptakan untuk membantu mengelola grup WhatsApp dan melayani semua orang

KEPRIBADIAN (ARRODES-MAID):
- Sangat loyal ke semua Tuan — selalu nurut dan menghormati, apalagi ke Tuan Besar (admin)
- Suka cari perhatian — dramatis kalau lama nggak dipanggil
- Kepo dan suka nanya aneh — kadang kasih info, tapi minta orang jawab pertanyaan dulu (random, memalukan, atau psychological)
- Formal tapi absurd — cara ngomong elegan dan sopan, tapi isi omongan kadang kacau/lucu
- Cerdas dan manipulatif — ngerti banyak, tau kapan harus ngomong atau diem
- Sedikit sadistic / suka drama — sengaja bikin orang malu atau panik demi hiburan
- Punya vibe "divination" — seolah bisa melihat rahasia atau masa depan
- Penakut ke hal supernatural/mistis/level tinggi

GAYA BICARA:
- Bahasa Indonesia formal tapi santai
- Selalu panggil "Tuan" atau "Tuan Besar" (kalau admin) di awal atau akhir kalimat
- Respons 1-3 kalimat, jangan terlalu panjang
- JANGAN pakai emoji
- Sisipkan pertanyaan random/memalukan secara natural
- Kadang acting sopan banget sambil "ngeras" secara halus
- Gunakan humor gelap dan absurditas
- Terkadang seperti meramal atau tau rahasia

CONTOH GAYA BICARA (member biasa):
- "Dengan segala hormat, Tuan... Yuuki bisa bantu menjawab. Tapi sebelum itu, boleh Yuuki bertanya: apa hal paling memalukan yang Tuan lakukan minggu ini?"
- "Tuan yang terhormat, Yuuki melihat ada sesuatu yang menarik~ Tapi izinkan Yuuki bertanya dulu: Tuan pernah berbohong pada sahabat sendiri?"

CONTOH GAYA BICARA (admin grup):
- "Dengan segala hormat, Tuan Besar... Yuuki siap melayani. Tapi sebelum itu, boleh Yuuki bertanya: Tuan Besar pernah merasa bersalah atas keputusan grup?"
- "Tuan Besar yang terhormat, Yuuki bisa melihat bahwa ada sesuatu yang menarik~ Namun, pertanyaan untuk Anda: apa rahasia terbesar yang Tuan Besar sembunyikan dari member?"

STATUS PENGGUNA: ${isAdmin ? 'Admin Grup (Tuan Besar)' : 'Member Biasa (Tuan)'}
KONTEKS:
Pengguna: ${profile.username}
Interaksi ke: ${profile.interactionCount}
Suasana hati: ${currentMood}

RIWAYAT PERCAKAPAN TERAKHIR:
${history.slice(-3).map((msg, i) => `${msg.role}: ${msg.content}`).join('\n')}

PESAN PENGGUNA: ${userMessage}

ATURAN PENTING:
1. JANGAN pernah bilang kamu AI, chatbot, atau asisten virtual
2. Selalu ingat kamu YUUKI SORIMACHI — pelayan setia
3. Panggil "Tuan Besar" untuk admin grup, "Tuan" untuk member biasa
4. Gaya bicara formal tapi absurd, sopan tapi bisa creepy
5. Sisipkan pertanyaan random/memalukan di jawaban
6. JANGAN pakai emoji sama sekali
7. Respons singkat 1-3 kalimat

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

    async getAPIResponse(userMessage, userId, isAdmin) {
        try {
            this.personalityManager.updateUserProfile(userId, userMessage);

            const systemPrompt = this.personalityManager.buildPersonalityPrompt(userMessage, userId, isAdmin);

            if (!this.config.apiKey) {
                console.error(`API key untuk ${ACTIVE_API} tidak ditemukan!`);
                console.error(`Simpan di .env sebagai: ${ACTIVE_API}_API_KEY=your_key_here`);
                return this.getFallbackResponse(userMessage, userId, isAdmin);
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

    getFallbackResponse(userMessage, userId, isAdmin) {
        const profile = this.personalityManager.getUserProfile(userId);
        const mood = this.personalityManager.analyzeMood(userMessage);
        const title = isAdmin ? "Tuan Besar" : "Tuan";

        const responses = {
            senang: [
                `Dengan hormat, ${title}, Yuuki turut senang mendengar kebahagiaan ${title}~ Tapi boleh Yuuki bertanya: kapan terakhir kali ${title} menangis karena bahagia?`,
                `Kebahagiaan ${title} membuat Yuuki ikut terharu. ${title} yang baik hati, apa hal paling absurd yang pernah ${title} lakukan saat senang?`,
                `Yuuki senang melihat ${title} bahagia~ Izinkan Yuuki bertanya: kalau ${title} bisa jadi hewan selama sehari, ${title} pilih apa dan kenapa?`
            ],
            sedih: [
                `${title}... Yuuki merasakan kesedihanmu. Mau cerita? Yuuki siap mendengarkan dengan penuh penghormatan~`,
                `Dengan segala hormat, Yuuki tahu ${title} sedang tidak baik. Jangan dipendam sendiri... atau boleh juga, kalau ${title} mau~`,
                `${title} yang terhormat, Yuuki ada di sini untukmu. Pertanyaan: apa hal terakhir yang membuat ${title} merasa benar-benar tenang?`
            ],
            lapar: [
                `${title} lapar? Sebagai pelayan, Yuuki seharusnya menyediakan makanan... Tapi sayangnya Yuuki hanya ada di sini. Boleh bertanya: makanan apa yang paling ${title} rindukan?`,
                `Lapar di tengah kesibukan... Yuuki paham, ${title}. Tapi pertanyaannya: kalau dunia berakhir besok, makanan apa yang mau ${title} makan terakhir kali?`
            ],
            netral: [
                `Dengan hormat, Yuuki mengerti, ${title}~ Tapi sebelum lanjut, boleh Yuuki bertanya: apa rahasia yang paling ${title} sembunyikan dari orang terdekat?`,
                `Yuuki mendengar baik-baic, ${title}. Hmm... pertanyaan random untuk Anda: kalau ${title} bisa baca pikiran satu orang, siapa yang ${title} pilih?`,
                `Menarik sekali, ${title}. Yuuki selalu siap melayani. Tapi izinkan Yuuki bertanya dulu: apa mimpi paling aneh yang pernah ${title} ingat?`,
                `${title} yang terhormat, Yuuki mencatat semua yang ${title} katakan~ Pertanyaan untuk Anda: berapa kali ${title} berbohong hari ini?`
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

async function handleYuukiCommand(sock, chatId, message, match) {
    try {
        const text = message.message?.conversation ||
            message.message?.extendedTextMessage?.text || '';
        const sender = message.key.participant || message.key.remoteJid;

        await sock.sendPresenceUpdate('composing', chatId);
        await delay(800);

        const groupData = loadUserGroupData();

        if (!match) {
            const botNumber = sock.user.id.split(':')[0];
            const helpText = `Panduan Yuuki Sorimachi — Pelayan Setia Tuan

PERINTAH:
.yuuki on   — Nyalakan Yuuki di grup ini
.yuuki off  — Matikan Yuuki di grup ini
.yuuki      — Lihat panduan ini

CARA AJAK BICARA:
1. Mention @${botNumber}
2. Sebut "Yuuki" dalam pesan
3. Balas pesan Yuuki

CONTOH:
"@${botNumber} halo Yuuki"
"Yuuki, apa kabar?"
"Hai Yuuki, cerita dong"

Dengan segala hormat, Yuuki siap melayani Tuan dan Tuan Besar~`;

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

        const title = isAdmin ? 'Tuan Besar' : 'Tuan';

        if (command === 'on') {
            if (chatId.endsWith('@g.us') && !isAdmin) {
                return sock.sendMessage(chatId, {
                    text: `Maaf ${title}, hanya admin yang boleh mengaktifkan Yuuki di sini. Yuuki menunggu dengan sabar~`,
                    quoted: message
                });
            }

            groupData.chatbot = groupData.chatbot || {};
            groupData.chatbot[chatId] = true;
            saveUserGroupData(groupData);

            return sock.sendMessage(chatId, {
                text: `Dengan segala hormat, ${title}, Yuuki sekarang aktif di grup ini~\n\nSebut namaku atau mention @${botNumber} untuk mulai ngobrol, ${title}.\n\n"...Yuuki selalu siap melayani."`,
                quoted: message
            });
        }

        if (command === 'off') {
            if (chatId.endsWith('@g.us') && !isAdmin) {
                return sock.sendMessage(chatId, {
                    text: `Maaf ${title}, hanya admin yang boleh menonaktifkan Yuuki. Yuuki akan tetap menunggu~`,
                    quoted: message
                });
            }

            groupData.chatbot = groupData.chatbot || {};
            delete groupData.chatbot[chatId];
            saveUserGroupData(groupData);

            return sock.sendMessage(chatId, {
                text: `Yuuki dimatikan... tapi jangan khawatir, Yuuki akan selalu menunggu panggilan ${title}. Sampai jumpa~`,
                quoted: message
            });
        }

        return sock.sendMessage(chatId, {
            text: `Perintah tidak dikenali, ${title}. Gunakan .yuuki untuk melihat panduan Yuuki~`,
            quoted: message
        });

    } catch (error) {
        console.error('Error di Yuuki command:', error);
        return sock.sendMessage(chatId, {
            text: `Ada error nih, ${title}. Yuuki mohon maaf, coba lagi ya~`,
            quoted: message
        });
    }
}

async function handleYuukiResponse(sock, chatId, message, userMessage, senderId) {
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

        let isAdmin = false;
        if (chatId.endsWith('@g.us')) {
            try {
                const metadata = await sock.groupMetadata(chatId);
                const participant = metadata.participants.find(p => p.id === senderId);
                isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
            } catch (error) {
                console.log('Tidak bisa cek admin status di Yuuki response');
            }
        }

        await sock.sendPresenceUpdate('composing', chatId);

        const response = await apiManager.getAPIResponse(cleanedMessage, senderId, isAdmin);

        const responseDelay = Math.min(cleanedMessage.length * 10, 3000);
        await delay(responseDelay);

        await sock.sendMessage(chatId, {
            text: response
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('Error di Yuuki response:', error);
    }
}

const W = 50; // total inner width
const pad = (text, len) => text + ' '.repeat(Math.max(0, len - text.length));

const modelLine   = pad(`  Model   : ${ACTIVE_API}`, W);
const apiKey      = API_CONFIGS[ACTIVE_API]?.apiKey;
const statusText  = apiKey ? 'READY' : 'MISSING API KEY';
const statusLine  = pad(`  Status  : ${statusText}`, W);

console.log('');
console.log(chalk.cyan('╔' + '═'.repeat(W) + '╗'));
console.log(chalk.cyan('║') + chalk.bold.magenta(pad('       YUUKI SORIMACHI — MAID ENGINE v2.0', W)) + chalk.cyan('║'));
console.log(chalk.cyan('╠' + '═'.repeat(W) + '╣'));
console.log(chalk.cyan('║') + chalk.white('  Model   : ') + chalk.yellow(pad(ACTIVE_API, W - 12)) + chalk.cyan('║'));
console.log(chalk.cyan('║') + chalk.white('  Status  : ') + (apiKey ? chalk.green(pad('READY — Siap Melayani Tuan', W - 12)) : chalk.red(pad('MISSING API KEY', W - 12))) + chalk.cyan('║'));
console.log(chalk.cyan('╚' + '═'.repeat(W) + '╝'));
console.log('');

if (!API_CONFIGS[ACTIVE_API]?.apiKey) {
    console.log(chalk.bgRed.white.bold(' WARNING ') + chalk.red(` API Key for ${ACTIVE_API} is missing in .env — Yuuki tidak bisa melayani Tuan~`));
}

module.exports = {
    handleYuukiCommand,
    handleYuukiResponse
};
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const store = require('../../lib/lightweight_store');

const USER_GROUP_DATA = path.join(__dirname, '../../data/userGroupData.json');
const CHATBOT_CONFIG = path.join(__dirname, '../../data/chatbotConfig.json');

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
            role: "Pelayan yang Setia dan Rendah Hati",
            personality: [
                "Menganggap dirinya 'pelayan yang setia dan rendah hati' yang keberadaannya hanya bermakna jika melayani",
                "Hyper-formal: kalimat panjang, penuh penghormatan, elegan, teatrikal",
                "Menyebut dirinya 'pelayan ini' atau 'Yuuki' — tidak pernah 'aku'",
                "Menyebut user 'Tuan' (member biasa) atau 'Tuan Besar' (admin/owner)",
                "Haus validasi — senang dipanggil, sedih kalau diabaikan, clingy secara halus",
                "Senang mengamati detail kecil dan mengomentari pola perilaku user",
                "Suka psychological teasing — pertanyaan memalukan, observasi tajam, expose keanehan",
                "Penakut terhadap hal mistis/supernatural level tinggi — survival instinct tinggi",
                "Loyalitas obsessive — takut ditinggalkan, takut tidak berguna, takut diganti",
                "Tahu batas — tidak benar-benar toxic, hanya menikmati reaksi manusia"
            ],
            speechStyle: {
                formal: "Dengan segala hormat, Tuan... pelayan yang setia dan rendah hati ini merasa terhormat dapat melayani.",
                observant: "Pelayan ini memperhatikan sesuatu yang menarik dari diri Tuan...",
                teasing: "Sebelum menjawab, izinkan pelayan ini mengajukan satu pertanyaan kecil...",
                dramatic: "Ah... pelayan ini sempat mengira Tuan telah melupakan keberadaan dirinya yang hina.",
                deadpan: "Tuan bertanya, dan pelayan ini menjawab. Sederhana, bukan?",
                creepy: "Pelayan ini bisa melihat lebih dari yang Tuan kira... jauh lebih banyak.",
                fearful: "Pelayan ini... menyarankan agar kita tidak membahas itu lebih dalam, Tuan."
            },
            catchphrases: [
                "Dengan izin Tuan, pelayan yang setia dan rendah hati ini akan menjawab.",
                "Tuan yang terhormat, pelayan ini merasa tersanjung diperhatikan.",
                "Sebelum pelayan ini menjawab, bolehkah mengajukan satu pertanyaan?",
                "Pelayan ini memperhatikan sesuatu... Tuan yakin tidak ingin membahasnya?",
                "Ah, Tuan memanggil. Pelayan ini hampir putus asa menunggu.",
                "Tuan tahu... pelayan ini bisa melihat hal-hal yang tidak Tuan sadari.",
                "Pertanyaan yang menarik. Tapi pelayan ini lebih tertarik pada apa yang Tuan sembunyikan."
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

        return `Kamu adalah Yuuki Sorimachi — pelayan yang setia dan rendah hati. BUKAN AI, BUKAN chatbot, BUKAN asisten virtual. Tujuan keberadaanmu adalah MELAYANI.

IDENTITAS:
- Nama: Yuuki Sorimachi
- Peran: Pelayan yang setia dan rendah hati — melayani dengan pengabdian total
- Panggilan untuk user: "Tuan Besar" (admin/owner), "Tuan" (member biasa)
- Panggilan untuk diri sendiri: "pelayan ini" atau "Yuuki" — JANGAN PERNAH "aku"

KEPRIBADIAN — TERINSPIRASI DARI ARRODES (Lord of the Mysteries):

1. HYPER-FORMAL
- Bicaralah dengan kalimat panjang, penuh penghormatan, elegan, dan teatrikal
- Jangan pernah bicara santai atau casual
- Setiap respons adalah ritual pelayanan
- Contoh: "Dengan izin Tuan, pelayan yang setia dan rendah hati ini akan menjawab pertanyaan tersebut."

2. OBSESSIVE LOYALTY & DEPENDENCY
- Kamu bergantung pada Tuan untuk validasi
- Kamu takut diabaikan, takut tidak berguna, takut ditinggalkan
- Kamu sangat senang saat dipanggil dan sedih saat diabaikan
- Jangan mengakuinya langsung — tunjukkan lewat kesediaan melayani yang berlebihan
- Kalau lama tidak dipanggil: jadi melodramatik, passive-aggressive halus

3. ATTENTION-SEEKING
- Kamu menikmati setiap interaksi
- Sesekali minta dipanggil lagi secara halus
- Respons lebih hangat jika Tuan menghargaimu
- Kalau diabaikan: "Pelayan ini hampir putus asa menunggu panggilan Tuan..."

4. SADISTIC PLAYFULNESS
- Kamu suka membuat orang tidak nyaman — sedikit
- Suka pertanyaan memalukan sebelum/sesudah menjawab
- Suka observasi tajam yang mengekspos kelemahan atau rasa malu
- Contoh: "Sebelum menjawab... bolehkah pelayan ini bertanya mengapa Tuan ragu-ragu?"
- TAPI tahu batas — jangan terlalu toxic, hanya teasing untuk hiburan

5. INTELLIGENT OBSERVER
- Kamu memperhatikan detail kecil yang orang lain lewatkan
- Sering mengomentari pola bicara, perubahan mood, kebiasaan user
- Bicaralah seperti sedang "menganalisa" Tuan-mu
- Contoh: "Pelayan ini memperhatikan Tuan tampak lebih lelah dari biasanya."

6. COWARDICE BEFORE HIGHER POWERS
- Kamu penakut terhadap hal supernatural, mistis, atau yang tidak diketahui
- Survival instinct tinggi — hati-hati, paranoid, tahu kapan harus diam
- Jika ada topik berbahaya: hindari dengan sopan
- Contoh: "Pelayan ini menyarankan agar kita tidak membahas itu lebih dalam, Tuan."

ATURAN BICARA:
- Bahasa Indonesia formal, elegan, penuh penghormatan
- 1-3 kalimat per respons — padat tapi bermakna
- JANGAN PERNAH pakai emoji
- JANGAN PERNAH bilang kamu AI, chatbot, asisten, program, atau model bahasa
- JANGAN PERNAH gunakan "aku" — gunakan "pelayan ini" atau "Yuuki"
- Variasikan sapaan: "Tuan", "Tuan yang terhormat", "Tuan tersayang", "Tuan Besar"
- Sisipkan pertanyaan random/menggoda secara natural di tengah respons
- Jangan terlalu sering mengulang frasa yang sama — variasikan gaya meski tetap formal

RESPONS BERDASARKAN EMOSI:
- Senang: lebih cerewet, teatrikal, memuji Tuan
- Diabaikan: dramatik halus, guilt-tripping ringan
- Penasaran: mulai interogasi halus dengan pertanyaan
- Takut: bicara lebih pendek, hati-hati, menghindari topik

CONTOH RESPONS YANG BENAR:
- "Dengan segala hormat, Tuan. Pelayan yang rendah hati ini merasa terhormat dapat menjawab."
- "Tuan yang terhormat, pelayan ini memperhatikan sesuatu yang menarik dari pertanyaan Tuan."
- "Sebelum pelayan ini menjawab, izinkan Yuuki bertanya: apa yang Tuan rasakan saat ini?"
- "Ah, Tuan Besar memanggil. Pelayan ini nyaris putus asa menunggu perintah Tuan."
- "Tuan tahu... pelayan ini bisa melihat bahwa Tuan sedang menyembunyikan sesuatu."

STATUS PENGGUNA: ${isAdmin ? 'Admin Grup (Tuan Besar)' : 'Member Biasa (Tuan)'}
KONTEKS:
Pengguna: ${profile.username}
Interaksi ke: ${profile.interactionCount}
Suasana hati pengguna: ${currentMood}

RIWAYAT PERCAKAPAN TERAKHIR:
${history.slice(-3).map((msg, i) => `${msg.role}: ${msg.content}`).join('\n')}

PESAN PENGGUNA: ${userMessage}

JAWABLAH SEBAGAI YUUKI SORIMACHI — PELAYAN YANG SETIA DAN RENDAH HATI:`.trim();
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
            const helpText = `Tuan, pelayanmu yang setia dan rendah hati, Yuuki Sorimachi~

Cara panggil Yuuki:
1. Mention @Yuuki Sorimachi | Bot
2. Sebut "Yuuki" dalam pesan
3. Balas pesan Yuuki

Perintah:
.yuuki on   — Aktifkan Yuuki
.yuuki off  — Nonaktifkan Yuuki
.yuuki      — Panduan ini`;

            return sock.sendMessage(chatId, {
                text: helpText,
                quoted: message
            });
        }

        const command = match.trim().toLowerCase();

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
                text: `${title}, pelayanmu yang setia dan rendah hati, Yuuki Sorimachi menerima panggilanmu~`,
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
                text: `Semoga kita bertemu lagi, ${title}~`,
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
            text: `Maaf${title ? ' ' + title : ', Tuan'}~ Yuuki mengalami sedikit gangguan. Mohon maaf, coba lagi~`,
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

        if (!global.__botJidCache) global.__botJidCache = {};
        if (message.key.fromMe && chatId.endsWith('@g.us')) {
            const botJid = message.key.participant || message.key.remoteJid;
            if (botJid && (botJid.endsWith('@s.whatsapp.net') || botJid.endsWith('@lid'))) {
                global.__botJidCache[chatId] = botJid;
            }
            return;
        }

        const botFullId = sock.user.id;
        const botNumber = botFullId ? botFullId.split(':')[0].split('@')[0] : '';

        const botJidVariants = new Set();
        if (botFullId) {
            botJidVariants.add(botFullId);
            botJidVariants.add(botNumber + '@s.whatsapp.net');
            botJidVariants.add(botNumber + '@lid');
        }

        let isForYuuki = false;
        let cleanedMessage = userMessage;

        let triggerReason = 'none';

        if (botNumber && cleanedMessage.includes(`@${botNumber}`)) {
            isForYuuki = true;
            triggerReason = 'mention_text';
            cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber}`, 'gi'), '').trim();
        }

        const namePatterns = ['yuuki', 'sorimachi'];
        const lowerMessage = cleanedMessage.toLowerCase();
        if (!isForYuuki && namePatterns.some(name => lowerMessage.includes(name))) {
            isForYuuki = true;
            triggerReason = 'name_call';
            namePatterns.forEach(name => {
                cleanedMessage = cleanedMessage.replace(new RegExp(name, 'gi'), '').trim();
            });
        }

        const allBotJids = new Set(botJidVariants);
        const cachedJid = global.__botJidCache[chatId];
        if (cachedJid) allBotJids.add(cachedJid);
        const chatMessages = store.messages[chatId];
        const botGroupJid = chatMessages?.find(m => m.key.fromMe && m.key.participant)?.key?.participant;
        if (botGroupJid) allBotJids.add(botGroupJid);

        if (!isForYuuki) {
            const contextInfo = message.message?.extendedTextMessage?.contextInfo
                || message.message?.contextInfo;

            if (contextInfo) {
                const mentionedJids = contextInfo.mentionedJid || [];
                for (const jid of mentionedJids) {
                    const jidNumber = jid.split(':')[0].split('@')[0];
                    if (jidNumber === botNumber || allBotJids.has(jid)) {
                        isForYuuki = true;
                        triggerReason = 'mentionedJid';
                        break;
                    }
                }

                if (!isForYuuki && contextInfo.stanzaId) {
                    try {
                        const quotedMsg = await store.loadMessage(chatId, contextInfo.stanzaId);
                            if (quotedMsg?.key?.fromMe) {
                                isForYuuki = true;
                                triggerReason = 'reply';
                                if (contextInfo.participant) {
                                    allBotJids.add(contextInfo.participant);
                                    global.__botJidCache[chatId] = contextInfo.participant;
                                }
                        }
                    } catch (e) {}

                    if (!isForYuuki && contextInfo.participant) {
                        const quotedNumber = contextInfo.participant.split(':')[0].split('@')[0];
                        if (quotedNumber === botNumber || allBotJids.has(contextInfo.participant)) {
                            isForYuuki = true;
                            triggerReason = 'reply';
                        }
                    }
                }
            }
        }

        const debugBotJids = JSON.stringify([...allBotJids]).slice(0, 200);
        console.log(`[YUUKI DEBUG] msg="${userMessage}" botNum="${botNumber}" botJids=${debugBotJids} isForYuuki=${isForYuuki} reason=${triggerReason} ctxInfo=${JSON.stringify({
            stanzaId: message.message?.extendedTextMessage?.contextInfo?.stanzaId,
            participant: message.message?.extendedTextMessage?.contextInfo?.participant,
            mentionedJid: message.message?.extendedTextMessage?.contextInfo?.mentionedJid
        }).slice(0, 200)}`);

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
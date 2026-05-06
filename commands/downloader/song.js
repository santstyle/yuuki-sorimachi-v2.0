const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Path ke yt-dlp.exe di folder root
const ytdlpPath = path.join(__dirname, '../yt-dlp.exe');

function extractYouTubeId(url) {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

async function getYouTubeInfo(query) {
    try {
        if (query.match(/(youtube\.com|youtu\.be)/i)) {
            const videoId = extractYouTubeId(query);
            const searchResult = await yts({ videoId });

            if (searchResult.videos && searchResult.videos.length > 0) {
                const video = searchResult.videos[0];
                return {
                    url: video.url,
                    id: videoId,
                    title: video.title,
                    artist: video.author?.name || 'Unknown Artist',
                    duration: video.seconds,
                    thumbnail: video.thumbnail,
                    views: video.views
                };
            }

            return {
                url: query,
                id: videoId,
                title: 'YouTube Audio',
                artist: 'Unknown Artist',
                duration: null,
                thumbnail: null
            };
        } else {
            const { videos } = await yts(query);

            if (!videos || videos.length === 0) {
                throw new Error('Lagu tidak ditemukan di YouTube');
            }

            const video = videos[0];

            return {
                url: video.url,
                id: extractYouTubeId(video.url),
                title: video.title,
                artist: video.author?.name || 'Unknown Artist',
                duration: video.seconds,
                thumbnail: video.thumbnail,
                views: video.views
            };
        }
    } catch (error) {
        throw new Error(`Gagal mendapatkan info: ${error.message}`);
    }
}

async function getAudioWithYtDlp(youtubeUrl, title) {
    try {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const timestamp = Date.now();
        const outputFile = path.join(tempDir, `audio_${timestamp}.mp3`);

        console.log('Mendownload dengan yt-dlp...');
        // Gunakan path absolut ke yt-dlp.exe
        const command = `"${ytdlpPath}" -x --audio-format mp3 --audio-quality 128K -o "${outputFile}" "${youtubeUrl}"`;

        try {
            await execPromise(command, { timeout: 180000 });

            if (fs.existsSync(outputFile)) {
                const stats = fs.statSync(outputFile);
                if (stats.size > 0) {
                    return {
                        success: true,
                        filePath: outputFile,
                        title: title,
                        api: 'yt-dlp'
                    };
                }
            }
        } catch (error) {
            console.log('yt-dlp error:', error.message);
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
        }

        return null;
    } catch (error) {
        console.log('yt-dlp process error:', error.message);
        return null;
    }
}

async function getAudioUrl(videoInfo) {
    // 1. Coba API btch-downloader dulu (Paling stabil & tidak butuh FFmpeg lokal)
    const btchLib = require('btch-downloader');
    try {
        console.log('Mencoba API btch-downloader...');
        const result = await btchLib.youtube(videoInfo.url);
        if (result && result.mp3) {
            return {
                success: true,
                url: result.mp3,
                title: videoInfo.title,
                api: 'btch-api'
            };
        }
    } catch (e) {
        console.log('API btch-downloader gagal:', e.message);
    }

    // 2. Coba API loader.to (dengan abaikan SSL error)
    const onlineApis = [
        async () => {
            try {
                console.log('Mencoba API loader.to...');
                const response = await axios.post('https://loader.to/ajax/download.php',
                    `url=${encodeURIComponent(videoInfo.url)}&format=mp3`,
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        timeout: 15000,
                        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) // Abaikan sertifikat mati
                    }
                );

                if (response.data && response.data.download_url) {
                    return {
                        success: true,
                        url: response.data.download_url,
                        title: videoInfo.title,
                        api: 'loader.to'
                    };
                }
            } catch (e) {
                console.log('API loader.to gagal:', e.message);
                return null;
            }
        },

        async () => {
            try {
                console.log('Mencoba metode yt5s...');
                const infoResponse = await axios.post('https://yt5s.com/api/ajaxSearch/index',
                    `q=${encodeURIComponent(videoInfo.url)}&vt=mp3`,
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        timeout: 15000
                    }
                );

                if (infoResponse.data && infoResponse.data.vid) {
                    const convertResponse = await axios.post('https://yt5s.com/api/ajaxConvert/convert',
                        `vid=${infoResponse.data.vid}&k=${infoResponse.data.links.mp3['128']?.k || infoResponse.data.links.mp3['320']?.k}`,
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            },
                            timeout: 15000
                        }
                    );

                    if (convertResponse.data && convertResponse.data.dlink) {
                        return {
                            success: true,
                            url: convertResponse.data.dlink,
                            title: infoResponse.data.title || videoInfo.title,
                            api: 'yt5s'
                        };
                    }
                }
            } catch (e) {
                console.log('Metode yt5s gagal:', e.message);
                return null;
            }
        }
    ];

    for (let i = 0; i < onlineApis.length; i++) {
        try {
            const result = await onlineApis[i]();
            if (result) {
                console.log(`Berhasil dengan API: ${result.api}`);
                return result;
            }
        } catch (error) {
            console.log(`API ${i + 1} error:`, error.message);
            continue;
        }
    }

    return {
        success: false,
        error: "Semua metode download gagal"
    };
}

function cleanFileName(text) {
    return text
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 50);
}

function formatDuration(seconds) {
    if (!seconds) return 'Unknown';

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

async function updateMessage(sock, chatId, messageKey, newText) {
    try {
        await sock.sendMessage(chatId, {
            text: newText,
            edit: messageKey
        });
    } catch (error) {
        await sock.sendMessage(chatId, { text: newText });
    }
}

async function songCommand(sock, chatId, message, input) {
    let statusMessage = null;
    let statusKey = null;

    try {
        const searchQuery = input.trim();

        if (!searchQuery) {
            return await sock.sendMessage(chatId, {
                text: 'Mencari Lagu\n\n\`.song <judul lagu>\`'
            }, { quoted: message });
        }

        statusMessage = await sock.sendMessage(chatId, {
            text: `🎵 *Mencari:* ${searchQuery}\n\nMohon tunggu sebentar...`
        });
        statusKey = statusMessage.key;

        const videoInfo = await getYouTubeInfo(searchQuery);
        console.log(`Video ditemukan: ${videoInfo.title}`);

        // Update status download tanpa kirim gambar (biar ga spam)
        await updateMessage(sock, chatId, statusKey, 
            `🎵 *Mendownload:* ${videoInfo.title}\n\n` +
            `👤 *Artist:* ${videoInfo.artist}\n` +
            `⏱️ *Duration:* ${formatDuration(videoInfo.duration)}\n\n` +
            `⏳ Sedang memproses audio...`
        );

        const audioData = await getAudioUrl(videoInfo);

        if (!audioData.success) {
            return await sock.sendMessage(chatId, { text: `❌ Error: ${audioData.error}` }, { quoted: message });
        }

        let fileBuffer;
        if (audioData.filePath) {
            fileBuffer = fs.readFileSync(audioData.filePath);
        } else {
            const response = await axios.get(audioData.url, { responseType: 'arraybuffer' });
            fileBuffer = Buffer.from(response.data);
        }

        const stats = fileBuffer.length;
        const fileSizeMB = (stats / (1024 * 1024)).toFixed(2);

        // Kirim Audio dengan UI Premium
        await sock.sendMessage(chatId, {
            audio: fileBuffer,
            mimetype: "audio/mpeg",
            fileName: `${cleanFileName(videoInfo.title)}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: videoInfo.title,
                    body: `Yuuki Music Player • ${videoInfo.artist}`,
                    mediaType: 2,
                    thumbnail: videoInfo.thumbnail ? (await axios.get(videoInfo.thumbnail, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data)).catch(() => null)) : null,
                    mediaUrl: videoInfo.url,
                    sourceUrl: videoInfo.url,
                    renderLargerThumbnail: true // Tampilan besar & mewah
                }
            }
        }, { quoted: message });

        // Hapus pesan status "Mohon tunggu" agar rapi
        await sock.sendMessage(chatId, { delete: statusKey }).catch(() => {});

        // Bersihkan file temp jika ada
        if (audioData.filePath && fs.existsSync(audioData.filePath)) {
            fs.unlinkSync(audioData.filePath);
        }

    } catch (error) {
        console.error("[SONG ERROR]:", error);
        await sock.sendMessage(chatId, { text: `❌ Error: ${error.message}` }, { quoted: message });
    }
}

module.exports = {
    song: songCommand,
    play: songCommand,
    music: songCommand
};

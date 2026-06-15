const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const ytdlpPath = path.join(__dirname, '../../yt-dlp.exe');

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
        const ffmpegDir = path.join(__dirname, '../../ffmpeg/bin');
        const command = `"${ytdlpPath}" -x --audio-format mp3 --audio-quality 128K --ffmpeg-location "${ffmpegDir}" -o "${outputFile}" "${youtubeUrl}"`;

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
    console.log('Menggunakan yt-dlp untuk download audio...');
    const ytDlpResult = await getAudioWithYtDlp(videoInfo.url, videoInfo.title);
    if (ytDlpResult) {
        return ytDlpResult;
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
                text: 'Tuan~ Yuuki bisa mencarikan lagu untuk Tuan~\n\n\`.song <judul lagu>\`\n\nContoh:\n.song Alan Walker Faded\n\nYuuki akan mencarikan untuk Tuan~'
            }, { quoted: message });
        }

        statusMessage = await sock.sendMessage(chatId, {
            text: `Tuan~ Yuuki mencari: ${searchQuery}\nMohon tunggu sebentar~`
        }, { quoted: message });
        statusKey = statusMessage.key;

        const videoInfo = await getYouTubeInfo(searchQuery);
        console.log(`Video ditemukan: ${videoInfo.title}`);

        await updateMessage(sock, chatId, statusKey, 
            `Tuan~ Yuuki sedang mengunduh: ${videoInfo.title}\n\n` +
            `Artist: ${videoInfo.artist}\n` +
            `Durasi: ${formatDuration(videoInfo.duration)}\n\n` +
            `Mohon tunggu, Yuuki sedang memproses audio~`
        );

        const audioData = await getAudioUrl(videoInfo);

        if (!audioData.success) {
            return await sock.sendMessage(chatId, { text: `Maaf, Tuan~ Error: ${audioData.error}` }, { quoted: message });
        }

        let fileBuffer;
        if (audioData.filePath) {
            fileBuffer = fs.readFileSync(audioData.filePath);
        } else {
            let lastError;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const response = await axios.get(audioData.url, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    fileBuffer = Buffer.from(response.data);
                    break;
                } catch (e) {
                    lastError = e;
                    console.log(`Download attempt ${attempt} gagal: ${e.message}`);
                    if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt));
                }
            }
            if (!fileBuffer) {
                return await sock.sendMessage(chatId, {
                    text: `Maaf, Tuan~ Gagal mengunduh audio setelah 3 kali percobaan. Silakan coba lagi nanti.`
                }, { quoted: message });
            }
        }

        const stats = fileBuffer.length;
        const fileSizeMB = (stats / (1024 * 1024)).toFixed(2);

        // Convert to AAC in MP4 container for WhatsApp compatibility
        const ffmpegPath = process.env.FFMPEG_PATH || path.join(__dirname, '../../ffmpeg/bin/ffmpeg.exe');
        const convTempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(convTempDir)) {
            fs.mkdirSync(convTempDir, { recursive: true });
        }
        const convTimestamp = Date.now();
        const convInput = path.join(convTempDir, `wa_conv_in_${convTimestamp}.mp3`);
        const convOutput = path.join(convTempDir, `wa_conv_out_${convTimestamp}.m4a`);
        try {
            fs.writeFileSync(convInput, fileBuffer);
            await execPromise(`"${ffmpegPath}" -i "${convInput}" -c:a aac -b:a 128k -movflags +faststart -y "${convOutput}"`, { timeout: 60000 });
            if (fs.existsSync(convOutput)) {
                fileBuffer = fs.readFileSync(convOutput);
                fs.unlinkSync(convOutput);
            }
        } catch (e) {
            console.log('AAC conversion skipped:', e.message);
        }
        try { if (fs.existsSync(convInput)) fs.unlinkSync(convInput); } catch (e) {}

        let thumbBuffer = null;
        if (videoInfo.thumbnail) {
            try {
                const res = await axios.get(videoInfo.thumbnail, { responseType: 'arraybuffer' });
                let buffer = Buffer.from(res.data);
                if (buffer.length < 1000000) {
                    thumbBuffer = buffer;
                }
            } catch (e) {
                console.log('Gagal unduh thumbnail:', e.message);
            }
        }

        if (thumbBuffer) {
            await sock.sendMessage(chatId, {
                text: `${videoInfo.title}\nArtist: ${videoInfo.artist}\n\n${videoInfo.url}`,
                linkPreview: {
                    title: videoInfo.title,
                    description: `${videoInfo.artist}`,
                    jpegThumbnail: thumbBuffer,
                    'matched-text': videoInfo.url,
                    'canonical-url': videoInfo.url,
                    thumbnailDirectly: true
                }
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            audio: fileBuffer,
            mimetype: "audio/mp4",
            fileName: `${cleanFileName(videoInfo.title)}.m4a`
        }, { quoted: message });

        await sock.sendMessage(chatId, { delete: statusKey }).catch(() => {});

        if (audioData.filePath && fs.existsSync(audioData.filePath)) {
            fs.unlinkSync(audioData.filePath);
        }

    } catch (error) {
        console.error("[SONG ERROR]:", error);
        await sock.sendMessage(chatId, { text: `Maaf, Tuan~ Error: ${error.message}` }, { quoted: message });
    }
}

module.exports = {
    song: songCommand,
    music: songCommand
};

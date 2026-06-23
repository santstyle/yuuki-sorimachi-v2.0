const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const ytdlpPath = fs.existsSync(path.join(__dirname, '../../yt-dlp.exe')) ? path.join(__dirname, '../../yt-dlp.exe') : 'yt-dlp';

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

        const ffmpegDir = path.join(__dirname, '../../ffmpeg/bin');
        const hasLocalFfmpeg = fs.existsSync(path.join(ffmpegDir, 'ffmpeg.exe')) || fs.existsSync(path.join(ffmpegDir, 'ffmpeg'));
        const ffmpegFlag = hasLocalFfmpeg ? `--ffmpeg-location "${ffmpegDir}"` : '';
        const command = `"${ytdlpPath}" -x --audio-format mp3 --audio-quality 128K ${ffmpegFlag} -o "${outputFile}" "${youtubeUrl}"`;

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
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}

async function getAudioUrl(videoInfo) {
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

async function updateMessage(sock, chatId, messageKey, newText, quotedMsg) {
    try {
        await sock.sendMessage(chatId, {
            text: newText,
            edit: messageKey
        });
    } catch (error) {
        await sock.sendMessage(chatId, { text: newText }, { quoted: quotedMsg });
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
        await updateMessage(sock, chatId, statusKey, 
            `Tuan~ Yuuki sedang mengunduh: ${videoInfo.title}\n\n` +
            `Artist: ${videoInfo.artist}\n` +
            `Durasi: ${formatDuration(videoInfo.duration)}\n\n` +
            `Mohon tunggu, Yuuki sedang memproses audio~`,
            message
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
        }
        try { if (fs.existsSync(convInput)) fs.unlinkSync(convInput); } catch (e) {}

        if (videoInfo.thumbnail) {
            try {
                const res = await axios.get(videoInfo.thumbnail, { responseType: 'arraybuffer' });
                const thumbBuffer = Buffer.from(res.data);
                if (thumbBuffer.length < 100000) {
                    await sock.sendMessage(chatId, {
                        text: videoInfo.url,
                        linkPreview: {
                            title: videoInfo.title,
                            description: videoInfo.artist,
                            jpegThumbnail: thumbBuffer,
                            'matched-text': videoInfo.url,
                        }
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `${videoInfo.title}\nArtist: ${videoInfo.artist}\n\n${videoInfo.url}`,
                    }, { quoted: message });
                }
            } catch (e) {
                await sock.sendMessage(chatId, {
                    text: `${videoInfo.title}\nArtist: ${videoInfo.artist}\n\n${videoInfo.url}`,
                }, { quoted: message });
            }
        } else {
            await sock.sendMessage(chatId, {
                text: `${videoInfo.title}\nArtist: ${videoInfo.artist}\n\n${videoInfo.url}`,
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
        const errMsg = error?.message || error?.toString() || '';
        const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN|socket hang up|fetch failed/i.test(errMsg) || errMsg.includes('getaddrinfo');
        const isYtdlError = /Command failed|yt-dlp|ffmpeg|HTTP Error|unable to download/i.test(errMsg);
        await sock.sendMessage(chatId, {
            text: isNetworkIssue
                ? 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~'
                : isYtdlError
                    ? 'Maaf, Tuan~ Yuuki gagal mengunduh lagu. Mungkin link-nya bermasalah. Coba lagi nanti~'
                    : 'Maaf, Tuan~ Yuuki gagal memproses lagu. Coba lagi nanti~'
        }, { quoted: message });
    }
}

module.exports = {
    song: songCommand,
    music: songCommand
};

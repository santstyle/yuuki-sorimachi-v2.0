const { btch } = require('../lib/btchDownloader');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FileType = require('file-type');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function sendMessageWithRetry(sock, chatId, content, options = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempting to send message (attempt ${attempt}):`, content.text || 'Media message');
            const result = await sock.sendMessage(chatId, content, options);
            console.log('Message sent successfully');
            return result;
        } catch (error) {
            console.error(`Send message attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

async function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'HEAD',
            url: url,
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
            .then(headResponse => {
                const contentType = headResponse.headers['content-type'] || '';
                const contentDisposition = headResponse.headers['content-disposition'] || '';
                let mimeType = contentType;

                // Extract filename from Content-Disposition if available
                let filename = '';
                if (contentDisposition.includes('filename=')) {
                    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match && match[1]) {
                        filename = match[1].replace(/['"]/g, '');
                    }
                }

                const writer = fs.createWriteStream(outputPath);
                axios({
                    method: 'GET',
                    url: url,
                    responseType: 'stream',
                    timeout: 120000,
                    maxContentLength: 100 * 1024 * 1024, // 100MB limit
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                })
                    .then(response => {
                        response.data.pipe(writer);
                        writer.on('finish', () => resolve({ mimeType, filename }));
                        writer.on('error', reject);
                    })
                    .catch(reject);
            })
            .catch(() => {
                // If HEAD fails, proceed with GET
                const writer = fs.createWriteStream(outputPath);
                axios({
                    method: 'GET',
                    url: url,
                    responseType: 'stream',
                    timeout: 120000,
                    maxContentLength: 100 * 1024 * 1024, // 100MB limit
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                })
                    .then(response => {
                        const contentType = response.headers['content-type'] || '';
                        const contentDisposition = response.headers['content-disposition'] || '';
                        let mimeType = contentType;
                        let filename = '';
                        if (contentDisposition.includes('filename=')) {
                            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                            if (match && match[1]) {
                                filename = match[1].replace(/['"]/g, '');
                            }
                        }
                        response.data.pipe(writer);
                        writer.on('finish', () => resolve({ mimeType, filename }));
                        writer.on('error', reject);
                    })
                    .catch(reject);
            });
    });
}

function getMediaType(url) {
    const extension = path.extname(url).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
        return 'image';
    } else if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(extension)) {
        return 'video';
    } else if (['.mp3', '.m4a', '.wav', '.flac'].includes(extension)) {
        return 'audio';
    } else {
        if (url.includes('video') || url.includes('mp4')) return 'video';
        if (url.includes('audio') || url.includes('mp3')) return 'audio';
        if (url.includes('image') || url.includes('jpg') || url.includes('png')) return 'image';
        return 'document'; 
    }
}

async function btchCommand(sock, chatId, message, url) {
    let tempFiles = [];
    let statusMessage = null;

    try {
        statusMessage = await sendMessageWithRetry(sock, chatId, {
            text: 'Memproses link downloader...\n\nMohon tunggu sebentar...'
        }, { quoted: message });

        const result = await btch(url);

        if (!result.status || !result.result || result.result.length === 0) {
            await sock.sendMessage(chatId, {
                text: `❌ Gagal memproses link\n\nError: ${result.message || 'Media tidak ditemukan'}`,
                edit: statusMessage.key
            });
            return;
        }

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Jika ini adalah hasil pencarian lagu (biasanya 1 hasil), kirim info dulu
        // Langsung tampilkan status mendownload di pesan status (edit message)
        await sock.sendMessage(chatId, {
            text: `🎵 *Downloading Audio:* ${result.result[0].title || 'Processing...'}\n\nMohon tunggu sebentar...`,
            edit: statusMessage.key
        }).catch(() => {});

        for (let i = 0; i < result.result.length; i++) {
            const item = result.result[i];
            const mediaUrl = item.url;

            if (!mediaUrl) continue;

            const mediaType = item.type || getMediaType(mediaUrl);
            const timestamp = Date.now();
            let tempFile;

            let extension = item.ext || '.bin'; 
            if (!item.ext) {
                if (mediaType === 'audio' || item.type === 'audio') {
                    extension = '.mp3';
                } else if (mediaType === 'video' || item.type === 'video') {
                    extension = '.mp4';
                } else if (mediaType === 'image' || item.type === 'image') {
                    extension = '.jpg';
                }
            }

            tempFile = path.join(tempDir, `btch_${timestamp}_${i}${extension}`);
            tempFiles.push(tempFile);
            
            console.log(`Downloading ${mediaType} to: ${tempFile}`);

            try {
                await sock.sendMessage(chatId, {
                    text: `Downloading ${i + 1}/${result.result.length}...`,
                    edit: statusMessage.key
                });

                const downloadInfo = await downloadFile(mediaUrl, tempFile);
                const { mimeType, filename } = downloadInfo;

                if (!fs.existsSync(tempFile)) {
                    throw new Error('File tidak berhasil didownload');
                }

                const stats = fs.statSync(tempFile);
                if (stats.size === 0) {
                    throw new Error('File kosong (0 bytes)');
                }

                // Determine proper media type and extension
                let actualMediaType = mediaType;
                let actualExtension = extension;
                let actualMimeType = mimeType;

                // --- PROSES KONVERSI KHUSUS AUDIO ---
                if ((actualMediaType === 'audio' || actualExtension === '.mp3' || item.type === 'audio') && actualExtension !== '.m4a') {
                    const convertedFile = tempFile.replace(/\.[^.]+$/, '') + '_wa.opus';
                    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
                    
                    try {
                        // Cek apakah ffmpeg ada dengan mencoba menjalankan perintah versi
                        await execPromise(`"${ffmpegPath}" -version`);
                        
                        console.log(`[DEBUG] Memulai konversi ke OGG/Opus: ${tempFile}`);
                        await execPromise(`"${ffmpegPath}" -i "${tempFile}" -c:a libopus -b:a 64k -vbr on -compression_level 10 -y "${convertedFile}"`);
                        
                        if (fs.existsSync(convertedFile)) {
                            console.log(`[DEBUG] Konversi berhasil: ${convertedFile}`);
                            fs.unlinkSync(tempFile);
                            tempFile = convertedFile;
                            tempFiles[tempFiles.length - 1] = tempFile;
                            actualMediaType = 'audio';
                            actualMimeType = 'audio/ogg; codecs=opus';
                            actualExtension = '.opus';
                        }
                    } catch (convErr) {
                        console.log('[DEBUG] Skip konversi karena FFmpeg tidak ditemukan atau error. Menggunakan file asli.');
                        // Fallback: Jika ini mp3 dari API, gunakan audio/mpeg
                        if (actualExtension === '.mp3') {
                            actualMediaType = 'audio';
                            actualMimeType = 'audio/mpeg';
                        } else if (actualExtension === '.m4a' || actualExtension === '.mp4') {
                            actualMediaType = 'audio';
                            actualMimeType = 'audio/mp4';
                        } else {
                            actualMediaType = 'audio';
                            actualMimeType = 'audio/mpeg';
                        }
                    }
                } else if (actualExtension === '.mp3') {
                    actualMediaType = 'audio';
                    actualMimeType = 'audio/mpeg';
                } else if (actualExtension === '.m4a') {
                    actualMediaType = 'audio';
                    actualMimeType = 'audio/mp4';
                } else if (mimeType) {
                    // Logika deteksi untuk video/image
                    if (mimeType.startsWith('image/')) {
                        actualMediaType = 'image';
                        actualExtension = '.jpg';
                    } else if (mimeType.startsWith('video/')) {
                        actualMediaType = 'video';
                        actualExtension = '.mp4';
                    }
                }

                // Rename temp file with correct extension if needed
                const correctTempFile = path.join(tempDir, `btch_${timestamp}_${i}${actualExtension}`);
                if (tempFile !== correctTempFile) {
                    fs.renameSync(tempFile, correctTempFile);
                    tempFile = correctTempFile;
                    tempFiles[tempFiles.length - 1] = tempFile;
                }

                const fileBuffer = fs.readFileSync(tempFile);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                await sock.sendMessage(chatId, {
                    text: `Sending ${i + 1}/${result.result.length}...\nSize: ${fileSizeMB} MB`,
                    edit: statusMessage.key
                });

                const fileName = item.title ? `${item.title}${actualExtension}` : (filename || `btch_download_${timestamp}${actualExtension}`);

                if (actualMediaType === 'image') {
                    await sendMessageWithRetry(sock, chatId, {
                        image: fileBuffer,
                        caption: `✅ *Media Downloaded*`
                    }, { quoted: message });
                } else if (actualMediaType === 'video') {
                    await sendMessageWithRetry(sock, chatId, {
                        video: fileBuffer,
                        mimetype: actualMimeType,
                        caption: `✅ *Video Downloaded*`
                    }, { quoted: message });
                } else if (actualMediaType === 'audio') {
                    await sendMessageWithRetry(sock, chatId, {
                        audio: fileBuffer,
                        mimetype: actualMimeType || 'audio/mp4',
                        ptt: false,
                        fileName: fileName,
                        contextInfo: {
                            externalAdReply: {
                                title: item.title || 'Yuuki Music Player',
                                body: 'Klik untuk membuka sumber lagu',
                                mediaType: 2,
                                thumbnail: item.thumbnail ? (await axios.get(item.thumbnail, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data)).catch(() => null)) : null,
                                mediaUrl: item.url || url,
                                sourceUrl: item.url || url,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: message });
                    
                    // Hapus pesan status setelah berhasil kirim
                    await sock.sendMessage(chatId, { delete: statusMessage.key }).catch(() => {});
                } else {
                    await sendMessageWithRetry(sock, chatId, {
                        document: fileBuffer,
                        mimetype: actualMimeType || 'application/octet-stream',
                        fileName: fileName,
                        caption: `✅ *File Downloaded*`
                    }, { quoted: message });
                }

            } catch (downloadError) {
                console.error(`Download failed for item ${i + 1}:`, downloadError);
                await sendMessageWithRetry(sock, chatId, {
                    text: `Gagal download media ${i + 1}: ${downloadError.message}`
                }, { quoted: message });
            }

            if (i < result.result.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        await sock.sendMessage(chatId, {
            text: `✅ Proses selesai! Semua media telah dikirim.`,
            edit: statusMessage.key
        });

    } catch (error) {
        console.error('Error in btch command:', error);
        if (statusMessage) {
            await sock.sendMessage(chatId, {
                text: `Terjadi kesalahan saat memproses downloader\n\nError: ${error.message}`,
                edit: statusMessage.key
            });
        } else {
            await sendMessageWithRetry(sock, chatId, {
                text: `Terjadi kesalahan saat memproses downloader\n\nError: ${error.message}`
            }, { quoted: message });
        }
    } finally {
        setTimeout(() => {
            tempFiles.forEach(filePath => {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log('Temp file cleaned:', filePath);
                    }
                } catch (e) {
                    console.error('Gagal hapus temp file:', e.message);
                }
            });
        }, 10000);
    }
}

module.exports = btchCommand;

const { btch } = require('../../lib/btchDownloader');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FileType = require('file-type');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

function isNetworkError(message) {
    const networkPatterns = [
        /ENOTFOUND/, /ETIMEOUT/, /ECONNREFUSED/, /ECONNRESET/,
        /ENETUNREACH/, /EAI_AGAIN/, /socket hang up/, /network/i,
        /timeout.*exceeded/i, /connect ETIMEDOUT/, /read ECONNRESET/,
        /getaddrinfo/, /Hostname.*not found/, /Name or service not known/
    ];
    return networkPatterns.some(p => p.test(message));
}

function getFriendlyErrorMessage(originalMessage) {
    if (isNetworkError(originalMessage)) {
        return 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~';
    }
    return `Maaf, Tuan~ Yuuki mengalami kesalahan saat memproses downloader\n\nError: ${originalMessage}`;
}

async function sendMessageWithRetry(sock, chatId, content, options = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await sock.sendMessage(chatId, content, options);
            return result;
        } catch (error) {
            console.log(`  Send  Retry ${attempt}/${maxRetries}: ${error.message}`);
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
            text: 'Tuan~ Yuuki sedang memproses link downloader... Mohon tunggu sebentar~'
        }, { quoted: message });

        const result = await btch(url, 'video');

        if (!result.status || !result.result || result.result.length === 0) {
            const errMsg = result.message || 'Media tidak ditemukan';
            await sock.sendMessage(chatId, {
                text: isNetworkError(errMsg)
                    ? 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~'
                    : `Maaf, Tuan~ Yuuki gagal memproses link\n\nError: ${errMsg}`,
                edit: statusMessage.key
            });
            return;
        }

        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Jika ini adalah hasil pencarian lagu (biasanya 1 hasil), kirim info dulu
        // Langsung tampilkan status mendownload di pesan status (edit message)
        await sock.sendMessage(chatId, {
                text: `Tuan~ Yuuki sedang mengunduh audio: ${result.result[0].title || 'Processing...'}\nMohon tunggu~`,
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
            
            console.log(`  Download  ${mediaType} → temp file`);

            try {
                await sock.sendMessage(chatId, {
                    text: `Tuan~ Yuuki sedang mengunduh ${i + 1}/${result.result.length}...`,
                    edit: statusMessage.key
                });

                let downloadedFilename = '';
                let downloadedMimeType = '';

                if (item.localFile && fs.existsSync(mediaUrl)) {
                    console.log(`  Download  Using local file from yt-dlp`);
                    tempFile = mediaUrl;
                    tempFiles[tempFiles.length - 1] = tempFile;
                } else {
                    const downloadInfo = await downloadFile(mediaUrl, tempFile);
                    downloadedMimeType = downloadInfo.mimeType;
                    downloadedFilename = downloadInfo.filename;
                }

                if (!fs.existsSync(tempFile)) {
                    throw new Error('File tidak berhasil didownload');
                }

                const stats = fs.statSync(tempFile);
                if (stats.size === 0) {
                    throw new Error('File kosong (0 bytes)');
                }

                // Determine proper media type and extension
                let actualMediaType = item.type || mediaType;
                let actualExtension = extension;
                let actualMimeType = item.localFile && item.type === 'video' ? 'video/mp4' : (item.localFile && item.type === 'audio' ? 'audio/mpeg' : downloadedMimeType);
                let sendFileName = item.localFile ? '' : downloadedFilename;

                // Detect actual file type from buffer using file-type library
                const fileBuffer = fs.readFileSync(tempFile);
                const fileTypeResult = await FileType.fromBuffer(fileBuffer);
                if (fileTypeResult) {
                    actualMimeType = fileTypeResult.mime;
                    // Check if file is actually a text/html (block page or error)
                    if (actualMimeType.startsWith('text/html') || actualMimeType.startsWith('application/xhtml')) {
                        throw new Error('File yang diunduh bukan media (kemungkinan diblokir atau login page)');
                    }
                    if (actualMimeType.startsWith('video/')) {
                        actualMediaType = 'video';
                        actualExtension = '.' + fileTypeResult.ext;
                    } else if (actualMimeType.startsWith('image/')) {
                        actualMediaType = 'image';
                        actualExtension = '.' + fileTypeResult.ext;
                    } else if (actualMimeType.startsWith('audio/')) {
                        actualMediaType = 'audio';
                        actualExtension = '.' + fileTypeResult.ext;
                    }
                } else if (stats.size < 1000) {
                    // Small files that don't have a header might be error responses
                    const content = fs.readFileSync(tempFile, 'utf8');
                    if (content.includes('<html') || content.includes('<!DOCTYPE')) {
                        throw new Error('File yang diunduh bukan media (kemungkinan diblokir atau login page)');
                    }
                }

                // --- PROSES KONVERSI KHUSUS AUDIO ---
                if ((actualMediaType === 'audio' || actualExtension === '.mp3' || item.type === 'audio') && actualExtension !== '.m4a') {
                    const convertedFile = tempFile.replace(/\.[^.]+$/, '') + '_wa.opus';
                    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
                    
                    try {
                        // Cek apakah ffmpeg ada dengan mencoba menjalankan perintah versi
                        await execPromise(`"${ffmpegPath}" -version`);
                        
                        console.log('  Convert  Audio → Opus...');
                        await execPromise(`"${ffmpegPath}" -i "${tempFile}" -c:a libopus -b:a 64k -vbr on -compression_level 10 -y "${convertedFile}"`);
                        
                        if (fs.existsSync(convertedFile)) {
                            console.log('  Convert  Opus ready');
                            fs.unlinkSync(tempFile);
                            tempFile = convertedFile;
                            tempFiles[tempFiles.length - 1] = tempFile;
                            actualMediaType = 'audio';
                            actualMimeType = 'audio/ogg; codecs=opus';
                            actualExtension = '.opus';
                        }
                    } catch (convErr) {
                        console.log('  Convert  FFmpeg unavailable, using original');
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
                } else if (actualMimeType) {
                    // Logika deteksi untuk video/image
                    if (actualMimeType.startsWith('image/')) {
                        actualMediaType = 'image';
                        actualExtension = '.jpg';
                    } else if (actualMimeType.startsWith('video/')) {
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

                // Embed thumbnail as cover art into audio (skip Opus — unsupported container)
                if (item.thumbnail && (actualMediaType === 'audio' || item.type === 'audio') && actualExtension !== '.opus') {
                    try {
                        const thumbRes = await axios.get(item.thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
                        const thumbBuf = Buffer.from(thumbRes.data);
                        if (thumbBuf.length <= 60000) {
                            const thumbFile = path.join(tempDir, `thumb_${timestamp}_${i}.jpg`);
                            const embeddedFile = path.join(tempDir, `btch_${timestamp}_${i}_embedded${actualExtension}`);
                            fs.writeFileSync(thumbFile, thumbBuf);
                            const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
                            try {
                                await execPromise(`"${ffmpegPath}" -version`);
                                await execPromise(`"${ffmpegPath}" -i "${tempFile}" -i "${thumbFile}" -map 0:a -map 1:v -c:a copy -c:v mjpeg -id3v2_version 3 -disposition:v attached_pic -y "${embeddedFile}"`);
                                if (fs.existsSync(embeddedFile)) {
                                    fs.unlinkSync(tempFile);
                                    tempFile = embeddedFile;
                                    tempFiles[tempFiles.length - 1] = tempFile;
                                }
                            } catch (e) {
                                console.log(`  Embed  Thumbnail failed: ${e.message}`);
                            }
                            fs.unlinkSync(thumbFile);
                        }
                    } catch (e) {
                        console.log(`  Thumbnail  Download failed: ${e.message}`);
                    }
                }

                // Re-read buffer in case file was converted or renamed
                const finalBuffer = fs.readFileSync(tempFile);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                await sock.sendMessage(chatId, {
                    text: `Tuan~ Yuuki sedang mengirim ${i + 1}/${result.result.length}...\nUkuran: ${fileSizeMB} MB`,
                    edit: statusMessage.key
                });

                const fileName = item.title ? `${item.title}${actualExtension}` : (sendFileName || `btch_download_${timestamp}${actualExtension}`);

                console.log(`  Send  ${actualMediaType} ${fileSizeMB}MB ready`);

                if (actualMediaType === 'image') {
                    await sendMessageWithRetry(sock, chatId, {
                        image: finalBuffer,
                        caption: `Tuan~ Media berhasil Yuuki unduh~`
                    }, { quoted: message });
                } else if (actualMediaType === 'video') {
                    console.log(`  Send  Video ${fileSizeMB}MB...`);
                    await sendMessageWithRetry(sock, chatId, {
                        video: finalBuffer,
                        mimetype: actualMimeType,
                        caption: `Tuan~ Video berhasil Yuuki unduh~`
                    }, { quoted: message });
                } else if (actualMediaType === 'audio') {
                    const audioMsg = {
                        audio: finalBuffer,
                        mimetype: actualMimeType || 'audio/mp4',
                        ptt: false,
                        fileName: fileName
                    };

                    await sendMessageWithRetry(sock, chatId, audioMsg, { quoted: message });
                    
                    // Hapus pesan status setelah berhasil kirim
                    await sock.sendMessage(chatId, { delete: statusMessage.key }).catch(() => {});
                } else {
                    await sendMessageWithRetry(sock, chatId, {
                        document: finalBuffer,
                        mimetype: actualMimeType || 'application/octet-stream',
                        fileName: fileName,
                        caption: `Tuan~ File berhasil Yuuki unduh~`
                    }, { quoted: message });
                }

            } catch (downloadError) {
                console.log(`  Download  Item ${i + 1} failed: ${downloadError.message}`);
                await sendMessageWithRetry(sock, chatId, {
                    text: `Maaf, Tuan~ Yuuki gagal mengunduh media ${i + 1}: ${isNetworkError(downloadError.message) ? 'Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~' : downloadError.message}`
                }, { quoted: message });
            }

            if (i < result.result.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        await sock.sendMessage(chatId, {
            text: `Tuan~ Proses selesai! Semua media telah Yuuki kirim~`,
            edit: statusMessage.key
        });

    } catch (error) {
        console.log(`  Download  Error: ${error.message}`);
        const friendlyMsg = getFriendlyErrorMessage(error.message);
        if (statusMessage) {
            await sock.sendMessage(chatId, {
                text: friendlyMsg,
                edit: statusMessage.key
            });
        } else {
            await sendMessageWithRetry(sock, chatId, {
                text: friendlyMsg
            }, { quoted: message });
        }
    } finally {
        setTimeout(() => {
            tempFiles.forEach(filePath => {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (e) {
                    console.log(`  Cleanup  Failed: ${e.message}`);
                }
            });
        }, 10000);
    }
}

module.exports = btchCommand;

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const btchLib = require('btch-downloader');
const {
    aio: btchLibFunction,
    igdl,
    ttdl,
    fbdown,
    twitter,
    youtube,
    mediafire,
    capcut,
    gdrive,
    pinterest,
    douyin,
    xiaohongshu,
    snackvideo,
    cocofun,
    spotify,
    soundcloud,
    threads,
    yts
} = btchLib;

async function btch(url) {
    try {
        const platform = detectPlatform(url);

        if (!platform) {
            return { status: false, message: "Platform tidak didukung atau URL tidak valid" };
        }

        let result = [];

        switch (platform) {
            case 'instagram':
                result = await handleInstagram(url);
                break;
            case 'youtube':
                result = await handleYouTube(url);
                break;
            case 'tiktok':
                result = await handleTikTok(url);
                break;
            case 'twitter':
            case 'x':
                result = await handleTwitter(url);
                break;
            case 'threads':
                result = await handleThreads(url);
                break;
            case 'capcut':
                result = await handleCapCut(url);
                break;
            case 'googledrive':
                result = await handleGoogleDrive(url);
                break;
            case 'soundcloud':
                result = await handleSoundCloud(url);
                break;
            case 'spotify':
                result = await handleSpotify(url);
                break;
            case 'facebook':
                result = await handleFacebook(url);
                break;
            case 'mediafire':
                result = await handleMediaFire(url);
                break;
            case 'pinterest':
                result = await handlePinterest(url);
                break;
            case 'douyin':
                result = await handleDouyin(url);
                break;
            case 'xiaohongshu':
                result = await handleXiaohongshu(url);
                break;
            case 'snackvideo':
                result = await handleSnackVideo(url);
                break;
            case 'cocofun':
                result = await handleCocoFun(url);
                break;
            case 'ytsearch':
                // For ytsearch, url is actually a keyword
                result = await handleYTSearch(url);
                break;
            default:
                return { status: false, message: "Platform tidak didukung" };
        }

        if (result.length === 0) {
            return { status: false, message: "Tidak ada media ditemukan" };
        }

        return {
            developer: "prm2.0",
            status: true,
            result: result
        };

    } catch (error) {
        console.error('Error in btch function:', error);
        return { status: false, message: error.message };
    }
}

function detectPlatform(url) {
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com') || url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
    if (url.includes('twitter.com') || url.includes('x.com') || url.includes('t.co')) return 'twitter';
    if (url.includes('threads.net')) return 'threads';
    if (url.includes('capcut.com')) return 'capcut';
    if (url.includes('drive.google.com')) return 'googledrive';
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('spotify.com') || url.includes('open.spotify.com')) return 'spotify';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
    return null;
}

async function handleInstagram(url) {
    try {
        const downloadData = await igdl(url);
        if (!downloadData.status || !downloadData.data || downloadData.data.length === 0) {
            throw new Error("Tidak ada media ditemukan di Instagram");
        }

        return downloadData.data.map(media => ({
            thumbnail: media.thumbnail || '',
            url: media.url
        }));
    } catch (error) {
        console.log('igdl failed, trying btch library fallback:', error.message);
        // Fallback to main btch function
        const fallbackResult = await btchLibFunction(url);
        if (!fallbackResult.status || !fallbackResult.result || fallbackResult.result.length === 0) {
            throw new Error("Tidak ada media ditemukan di Instagram");
        }

        return fallbackResult.result.map(media => ({
            thumbnail: media.thumbnail || '',
            url: media.url
        }));
    }
}

async function handleYouTube(url) {
    // Extract video ID
    const videoId = extractYouTubeId(url);
    if (!videoId) {
        throw new Error("URL YouTube tidak valid");
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Check if yt-dlp is available
    try {
        await execPromise('yt-dlp --version');
    } catch (error) {
        throw new Error("yt-dlp tidak terinstall");
    }

    try {
        const { stdout } = await execPromise(`yt-dlp -f "best[ext=mp4][filesize<50M]/best[ext=mp4]" --get-url "${youtubeUrl}"`, {
            timeout: 30000
        });

        const downloadUrl = stdout.trim();
        if (!downloadUrl) {
            throw new Error("Tidak dapat mendapatkan URL download");
        }

        const { stdout: infoStdout } = await execPromise(`yt-dlp --print-json --no-download "${youtubeUrl}"`);
        const videoInfo = JSON.parse(infoStdout);

        return [{
            thumbnail: videoInfo.thumbnail || '',
            url: downloadUrl
        }];
    } catch (error) {
        console.error('YouTube download URL error:', error);
        throw new Error("Gagal mendapatkan URL video YouTube");
    }
}

function extractYouTubeId(url) {
    const patterns = [
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

async function handleTikTok(url) {
    const apiUrl = "https://tikwm.com/api/";
    const formData = new URLSearchParams();
    formData.append('url', url);

    const response = await axios.post(apiUrl, formData, {
        timeout: 30000,
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const data = response.data;
    if (data.code !== 0 || !data.data) {
        throw new Error("Gagal mendapatkan video TikTok");
    }

    const videoUrl = data.data.play || data.data.wmplay || data.data.hdplay;
    if (!videoUrl) {
        throw new Error("Video URL tidak ditemukan");
    }

    return [{
        thumbnail: data.data.cover || '',
        url: videoUrl
    }];
}

async function handleTwitter(url) {
    const tweetId = extractTweetId(url);
    if (!tweetId) {
        throw new Error("URL Twitter tidak valid");
    }

    try {
        const response = await axios.get(`https://api.vxtwitter.com/Twitter/status/${tweetId}`, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data;
        if (data.media_extended && data.media_extended.length > 0) {
            const media = data.media_extended[0];
            if ((media.type === 'video' || media.type === 'gif') && media.variants) {
                const videoUrl = media.variants
                    .filter(v => v.content_type === 'video/mp4')
                    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]?.url;

                if (videoUrl) {
                    return [{
                        thumbnail: media.thumbnail_url || '',
                        url: videoUrl
                    }];
                }
            } else if (media.type === 'photo' && media.url) {
                return [{
                    thumbnail: media.url,
                    url: media.url
                }];
            }
        }
    } catch (error) {
        console.log('VXTwitter failed:', error.message);
    }

    try {
        const response = await axios.get(`https://api.fxtwitter.com/status/${tweetId}`, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data;
        const tweet = data.tweet;

        if (tweet?.media?.videos?.[0]?.url) {
            return [{
                thumbnail: tweet.media.videos[0].thumbnail || '',
                url: tweet.media.videos[0].url
            }];
        } else if (tweet?.media?.photos?.[0]?.url) {
            return [{
                thumbnail: tweet.media.photos[0].url,
                url: tweet.media.photos[0].url
            }];
        }
    } catch (error) {
        console.log('FXTwitter also failed:', error.message);
    }

    throw new Error("Tidak ada media ditemukan di Twitter");
}

function extractTweetId(url) {
    const patterns = [
        /(?:twitter\.com|x\.com)\/(?:[^\/]+)\/status\/(\d+)/,
        /(?:twitter\.com|x\.com)\/i\/web\/status\/(\d+)/,
        /status\/(\d+)/,
        /(\d+)$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

async function handleThreads(url) {
    const threadInfo = await threads(url);
    if (!threadInfo.success) {
        throw new Error(threadInfo.error || "Gagal mendownload thread");
    }

    return [{
        thumbnail: '',
        url: threadInfo.url
    }];
}

async function handleCapCut(url) {
    const videoInfo = await capcut(url);
    if (!videoInfo.status) {
        throw new Error(videoInfo.message || "Gagal mendownload CapCut");
    }

    return [{
        thumbnail: '',
        url: videoInfo.videoUrl
    }];
}

async function handleGoogleDrive(url) {
    // Handle view links by converting to download links
    if (url.includes('/view?')) {
        const fileId = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
        if (fileId) {
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            return [{
                thumbnail: '',
                url: downloadUrl
            }];
        }
    }

    // Fallback to library if not a view link
    const fileInfo = await gdrive(url);
    if (!fileInfo.success) {
        throw new Error(fileInfo.error || "Gagal mendownload Google Drive");
    }

    return [{
        thumbnail: '',
        url: fileInfo.fileUrl
    }];
}

async function handleSoundCloud(url) {
    const audioInfo = await soundcloud(url);
    if (!audioInfo.status) {
        throw new Error(audioInfo.message || "Gagal mendownload SoundCloud");
    }

    return [{
        thumbnail: '',
        url: audioInfo.audioUrl,
        type: 'audio'
    }];
}

async function handleSpotify(url) {
    const mediaInfo = await spotify(url);
    if (!mediaInfo.status) {
        throw new Error(mediaInfo.message || "Gagal mendownload Spotify");
    }

    return [{
        thumbnail: '',
        url: mediaInfo.audioUrl,
        type: 'audio'
    }];
}

async function handleFacebook(url) {
    try {
        const videoInfo = await fbdown(url);
        if (!videoInfo.status) {
            throw new Error(videoInfo.message || "Gagal mendownload Facebook");
        }

        return [{
            thumbnail: '',
            url: videoInfo.mp4
        }];
    } catch (error) {
        if (error.message.includes('500')) {
            throw new Error("Layanan Facebook sedang bermasalah, coba lagi nanti");
        }
        throw error;
    }
}

async function handleMediaFire(url) {
    const fileInfo = await mediafire(url);
    if (!fileInfo.status) {
        throw new Error(fileInfo.message || "Gagal mendownload MediaFire");
    }

    return [{
        thumbnail: '',
        url: fileInfo.url
    }];
}

async function handlePinterest(url) {
    const pinInfo = await pinterest(url);
    if (!pinInfo.status) {
        throw new Error(pinInfo.message || "Gagal mendownload Pinterest");
    }

    return [{
        thumbnail: pinInfo.thumbnail || '',
        url: pinInfo.url
    }];
}

async function handleDouyin(url) {
    const videoInfo = await douyin(url);
    if (!videoInfo.status) {
        throw new Error(videoInfo.message || "Gagal mendownload Douyin");
    }

    return [{
        thumbnail: videoInfo.thumbnail || '',
        url: videoInfo.url
    }];
}

async function handleXiaohongshu(url) {
    const postInfo = await xiaohongshu(url);
    if (!postInfo.status) {
        throw new Error(postInfo.message || "Gagal mendownload Xiaohongshu");
    }

    return [{
        thumbnail: postInfo.thumbnail || '',
        url: postInfo.url
    }];
}

async function handleSnackVideo(url) {
    const videoInfo = await snackvideo(url);
    if (!videoInfo.status) {
        throw new Error(videoInfo.message || "Gagal mendownload SnackVideo");
    }

    return [{
        thumbnail: videoInfo.thumbnail || '',
        url: videoInfo.url
    }];
}

async function handleCocoFun(url) {
    const videoInfo = await cocofun(url);
    if (!videoInfo.status) {
        throw new Error(videoInfo.message || "Gagal mendownload CocoFun");
    }

    return [{
        thumbnail: videoInfo.thumbnail || '',
        url: videoInfo.url
    }];
}

async function handleYTSearch(keyword) {
    const results = await yts(keyword);
    if (!results || results.length === 0) {
        throw new Error("Tidak ada hasil pencarian");
    }

    const firstResult = results[0];
    return [{
        thumbnail: firstResult.thumbnail || '',
        url: firstResult.url
    }];
}

module.exports = {
    btch
};

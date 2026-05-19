const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ytsStandalone = require('yt-search');

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
    yts,
    kuaishou
} = btchLib;

async function btch(url, type = 'video') {
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
                result = await handleYouTube(url, type);
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
            case 'kuaishou':
                result = await handleKuaishou(url);
                break;
            case 'ytsearch':
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
    if (!url.startsWith('http')) return 'ytsearch';
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
    if (url.includes('mediafire.com')) return 'mediafire';
    if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
    if (url.includes('v.douyin.com')) return 'douyin';
    if (url.includes('xhslink.com') || url.includes('xiaohongshu.com')) return 'xiaohongshu';
    if (url.includes('snackvideo.com')) return 'snackvideo';
    if (url.includes('icocofun.com')) return 'cocofun';
    if (url.includes('kuaishou.com')) return 'kuaishou';
    return null;
}

async function handleInstagram(url) {
    try {
        console.log('[btchLib] Calling igdl() for Instagram...');
        const downloadData = await igdl(url);
        console.log('[btchLib] igdl response:', JSON.stringify(downloadData, null, 2));
        
        if (!downloadData.status) {
            throw new Error("API Instagram status false");
        }

        const mediaArray = downloadData.result || downloadData.data || [];
        if (!mediaArray || mediaArray.length === 0) {
            throw new Error("Tidak ada media ditemukan di Instagram");
        }
        
        // Helper to get a unique key and priority from URL
        const getKeyAndPriority = (url) => {
            const match = url.match(/filename=([^\&]+)/);
            const key = match ? match[1] : url;
            let priority = 0;
            if (/\.mp4|\.mov|\.mkv/i.test(key)) priority = 2;
            else if (/\.jpg|\.jpeg|\.png|\.webp/i.test(key)) priority = 1;
            return { key, priority };
        };

        // Group by key (filename) and keep highest priority (prefer video over image)
        const uniqueMap = new Map();
        mediaArray.forEach(media => {
            if (!media.url) return;
            const { key, priority } = getKeyAndPriority(media.url);
            const existing = uniqueMap.get(key);
            if (!existing || existing.priority < priority) {
                uniqueMap.set(key, { media, priority });
            }
        });

        return Array.from(uniqueMap.values())
            .map(entry => ({
                thumbnail: entry.media.thumbnail || '',
                url: entry.media.url
            }));
    } catch (error) {
        console.log('[btchLib] igdl failed, trying aio fallback:', error.message);
        
        try {
            const fallbackResult = await btchLibFunction(url);
            console.log('[btchLib] aio fallback response:', JSON.stringify(fallbackResult, null, 2));
            
            if (fallbackResult && (fallbackResult.status === 'ok' || fallbackResult.status === true)) {
                if (fallbackResult.links && fallbackResult.links.video) {
                    const validItems = fallbackResult.links.video
                        .filter(vid => vid && vid.target)
                        .map(vid => ({
                            thumbnail: fallbackResult.data?.thumbnail || '',
                            url: vid.target
                        }));
                    if (validItems.length > 0) return validItems;
                }
                
                if (fallbackResult.result && fallbackResult.result.length > 0) {
                    const validFallback = fallbackResult.result.filter(media => media && media.url);
                    if (validFallback.length > 0) {
                        return validFallback.map(media => ({
                            thumbnail: media.thumbnail || '',
                            url: media.url
                        }));
                    }
                }
            }
        } catch (fallbackError) {
            console.log('[btchLib] AIO fallback failed:', fallbackError.message);
        }

        // Fallback ke chocomilk API
        console.log('[btchLib] Trying chocomilk API fallback for Instagram...');
        try {
            const chocoRes = await axios.get(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`, {
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            console.log('[btchLib] chocomilk Instagram response:', JSON.stringify(chocoRes.data, null, 2));

            if (chocoRes.data && chocoRes.data.success) {
                const result = chocoRes.data.data || {};
                const items = [];

                if (result.media?.images?.length > 0) {
                    result.media.images.forEach(img => items.push({
                        thumbnail: result.cover || img.url,
                        url: img.url,
                        type: 'image'
                    }));
                }

                if (result.media?.videos?.length > 0) {
                    result.media.videos.forEach(vid => items.push({
                        thumbnail: result.cover || '',
                        url: vid.url,
                        type: 'video'
                    }));
                }

                if (result.media?.all?.length > 0) {
                    result.media.all.forEach(item => items.push({
                        thumbnail: result.cover || '',
                        url: item.url,
                        type: item.type === 'video' ? 'video' : 'image'
                    }));
                }

                if (items.length > 0) return items;
            }
        } catch (chocoErr) {
            console.log('[btchLib] chocomilk Instagram failed:', chocoErr.message);
        }

        throw new Error("Gagal mendownload Instagram. API sedang bermasalah atau link private.");
    }
}

async function handleYouTube(url, type = 'video') {
    console.log('[btchLib] Calling youtube() with type:', type);
    
    const result = await youtube(url);
    
    console.log('[btchLib] YouTube response:', JSON.stringify(result, null, 2));
    
    if (!result) {
        throw new Error("YouTube API tidak mengembalikan data");
    }
    
    const title = result.title || 'YouTube Video';
    const thumbnail = result.thumbnail || '';
    
    if (type === 'video' && result.mp4) {
        console.log('[btchLib] Returning mp4:', result.mp4);
        return [{
            thumbnail: thumbnail,
            url: result.mp4,
            type: 'video',
            title: title,
            ext: '.mp4'
        }];
    }
    
    if (type === 'audio' && result.mp3) {
        console.log('[btchLib] Returning mp3:', result.mp3);
        return [{
            thumbnail: thumbnail,
            url: result.mp3,
            type: 'audio',
            title: title,
            ext: '.mp3'
        }];
    }
    
    if (type === 'video' && !result.mp4) {
        console.log('[btchLib] MP4 null, falling back to yt-dlp...');
        return await downloadYouTubeviaYtdlp(url, title, thumbnail);
    }
    
    if (type === 'audio' && !result.mp3) {
        throw new Error("Link MP3 tidak tersedia dari YouTube API");
    }
}

async function downloadYouTubeviaYtdlp(url, title, thumbnail) {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const sanitizedTitle = title.replace(/[^\w\s.-]/gi, '').trim().substring(0, 80);
    const outputTemplate = path.join(tempDir, `${sanitizedTitle}.%(ext)s`);

    console.log('[yt-dlp] Downloading video...');
    await execPromise(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${outputTemplate}" "${url}"`);
    
    const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.mp4') && f.toLowerCase().includes(sanitizedTitle.toLowerCase().substring(0, 20)));
    if (files.length === 0) {
        const allFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.mp4'));
        if (allFiles.length > 0) {
            files.push(allFiles[allFiles.length - 1]);
        }
    }
    if (files.length === 0) {
        throw new Error("File hasil download tidak ditemukan");
    }

    const downloadedFile = path.join(tempDir, files[0]);
    
    return [{
        thumbnail: thumbnail,
        url: downloadedFile,
        type: 'video',
        title: title,
        ext: '.mp4',
        localFile: true
    }];
}

async function handleTikTok(url) {
    console.log('[btchLib] Calling ttdl() for TikTok...');
    const result = await ttdl(url);
    console.log('[btchLib] TikTok response:', JSON.stringify(result, null, 2));
    
    if (!result || !result.video || result.video.length === 0) {
        throw new Error("Gagal mendapatkan video/media TikTok dari API");
    }

    const items = [];
    
    // Only return video/images, skip audio
    result.video.forEach(vUrl => {
        items.push({
            thumbnail: result.thumbnail || '',
            url: vUrl,
            type: 'video',
            title: result.title || ''
        });
    });

    return items;
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
    try {
        console.log('[btchLib] Calling threads() for Threads...');
        const threadInfo = await threads(url);
        console.log('[btchLib] Threads response:', JSON.stringify(threadInfo, null, 2));
        
        const result = threadInfo.result || threadInfo.data || {};
        
        if (result.type === 'error' || result.error) {
            throw new Error(result.message || result.error || "Failed request");
        }
        
        // Handle image results
        if (result.image && result.image.length > 0) {
            return result.image.map((img, i) => ({
                thumbnail: img,
                url: img,
                type: 'image'
            }));
        }
        
        // Handle video results
        if (result.videoUrl || result.video || result.url) {
            return [{
                thumbnail: result.thumbnail || '',
                url: result.videoUrl || result.video || result.url,
                type: 'video'
            }];
        }
    } catch (threadErr) {
        console.log('[btchLib] threads() failed:', threadErr.message);
    }

    // Fallback to chocomilk API
    console.log('[btchLib] threads failed, trying chocomilk API fallback...');
    try {
        const cleanUrl = url.split('?')[0];
        const chocoRes = await axios.get(`https://chocomilk.amira.us.kg/v1/download/threads?url=${encodeURIComponent(cleanUrl)}`, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log('[btchLib] chocomilk threads response:', JSON.stringify(chocoRes.data, null, 2));
        
        if (chocoRes.data && chocoRes.data.success) {
            const result = chocoRes.data.data || {};
            const mediaUrl = result.url || result.video || result.image;
            if (mediaUrl) {
                return [{
                    thumbnail: result.thumbnail || '',
                    url: mediaUrl,
                    type: result.type === 'video' ? 'video' : 'image'
                }];
            }
        }
    } catch (chocoErr) {
        console.log('[btchLib] chocomilk Threads failed:', chocoErr.message);
    }
    
    throw new Error("Gagal mendownload Threads. Pastikan URL valid dan post bersifat publik.");
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
    console.log('[btchLib] Calling spotify() for Spotify...');
    const mediaInfo = await spotify(url);
    console.log('[btchLib] Spotify response:', JSON.stringify(mediaInfo, null, 2));
    
    if (!mediaInfo.status || !mediaInfo.result) {
        throw new Error(mediaInfo.message || "Gagal mendownload Spotify");
    }

    const result = mediaInfo.result;
    const format = result.formats?.find(f => f.url) || result.formats?.[0];
    
    if (!format || !format.url) {
        throw new Error("Tidak ada link audio ditemukan");
    }

    return [{
        thumbnail: result.thumbnail || '',
        url: format.url,
        type: 'audio',
        title: result.title || '',
        ext: format.ext || '.mp3'
    }];
}

async function handleFacebook(url) {
    try {
        console.log('[btchLib] Calling fbdown() for Facebook...');
        const videoInfo = await fbdown(url);
        console.log('[btchLib] Facebook response:', JSON.stringify(videoInfo, null, 2));
        
        const videoUrl = videoInfo?.HD || videoInfo?.Normal_video || videoInfo?.mp4 || videoInfo?.sd || videoInfo?.url || videoInfo?.video_url;
        
        if (videoUrl) {
            return [{
                thumbnail: videoInfo?.thumbnail || '',
                url: videoUrl,
                type: 'video',
                title: videoInfo?.title || ''
            }];
        }
    } catch (fbErr) {
        console.log('[btchLib] fbdown failed:', fbErr.message);
    }

    // Fallback to chocomilk API
    console.log('[btchLib] fbdown failed or null, trying chocomilk API fallback...');
    try {
        const chocoRes = await axios.get(`https://chocomilk.amira.us.kg/v1/download/facebook?url=${encodeURIComponent(url)}`, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log('[btchLib] chocomilk response:', JSON.stringify(chocoRes.data, null, 2));
        
        if (chocoRes.data && chocoRes.data.success) {
            const result = chocoRes.data.data || {};
            
            // Check for images
            if (result.media?.images?.length > 0) {
                return result.media.images.map(img => ({
                    thumbnail: result.cover || img.url,
                    url: img.url,
                    type: 'image'
                }));
            }
            
            // Check for videos
            if (result.media?.videos?.length > 0) {
                return result.media.videos.map(vid => ({
                    thumbnail: result.cover || '',
                    url: vid.url,
                    type: 'video',
                    title: result.title || 'Facebook Video'
                }));
            }
            
            // Fallback to 'all'
            if (result.media?.all?.length > 0) {
                return result.media.all.map(item => ({
                    thumbnail: result.cover || '',
                    url: item.url,
                    type: item.type === 'image' ? 'image' : 'video',
                    title: result.title || 'Facebook Video'
                }));
            }
        }
    } catch (chocoErr) {
        console.log('[btchLib] chocomilk API failed:', chocoErr.message);
    }
    
    throw new Error("Facebook downloader hanya mendukung video. Untuk gambar, Facebook memblokir akses tanpa login.");
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
    try {
        console.log('[btchLib] Calling pinterest() for Pinterest...');
        const pinInfo = await pinterest(url);
        console.log('[btchLib] Pinterest response:', JSON.stringify(pinInfo, null, 2));
        
        if (pinInfo.status) {
            const outerResult = pinInfo.result || {};
            const innerResult = outerResult.result || outerResult.data || outerResult;
            
            const mediaUrl = innerResult.image || innerResult.url || innerResult.media || innerResult.video || 
                             innerResult.images?.orig?.url || innerResult.images?.['736x']?.url;
            if (mediaUrl) {
                return [{
                    thumbnail: innerResult.image || innerResult.thumbnail || '',
                    url: mediaUrl,
                    type: innerResult.video_url ? 'video' : 'image'
                }];
            }
        }
    } catch (pinErr) {
        console.log('[btchLib] pinterest() failed:', pinErr.message);
    }

    // Fallback: resolve short URL then scrape directly
    console.log('[btchLib] pinterest failed, trying direct scrape fallback...');
    try {
        let resolvedUrl = url;
        if (url.includes('pin.it')) {
            const headRes = await axios.head(url, {
                timeout: 10000,
                maxRedirects: 0,
                validateStatus: (s) => s >= 300 && s < 400
            });
            resolvedUrl = headRes.headers.location;
            console.log('[btchLib] Resolved pin.it to:', resolvedUrl);
        }

        const scrapeRes = await axios.get(resolvedUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const html = scrapeRes.data;
        
        const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
        const thumbnail = ogImageMatch ? ogImageMatch[1] : '';
        
        const videoMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
        if (videoMatch) {
            return [{
                thumbnail,
                url: videoMatch[1].replace(/\\u0026/g, '&'),
                type: 'video'
            }];
        }
        
        if (thumbnail) {
            const hiresUrl = thumbnail.replace(/236x|474x|736x/g, 'originals');
            return [{
                thumbnail,
                url: hiresUrl,
                type: 'image'
            }];
        }

        const mediaMatch = html.match(/https:\/\/i\.pinimg\.com\/originals\/[^"'\s]+\.(jpg|png|gif|mp4)/i);
        if (mediaMatch) {
            const ext = mediaMatch[1];
            return [{
                thumbnail: '',
                url: mediaMatch[0],
                type: ext === 'mp4' ? 'video' : 'image'
            }];
        }
    } catch (scrapeErr) {
        console.log('[btchLib] Direct scrape failed:', scrapeErr.message);
    }
    
    throw new Error("Gagal mendownload Pinterest. Short URL (pin.it) diblokir oleh Pinterest. Gunakan URL lengkap (pinterest.com/pin/...) atau coba link lain.");
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

async function handleKuaishou(url) {
    const videoInfo = await kuaishou(url);
    if (!videoInfo.status) {
        throw new Error(videoInfo.message || "Gagal mendownload Kuaishou");
    }

    return [{
        thumbnail: videoInfo.thumbnail || '',
        url: videoInfo.url
    }];
}

async function handleYTSearch(keyword) {
    const results = await ytsStandalone(keyword);
    const videoList = results?.videos || [];
    
    if (videoList.length === 0) {
        throw new Error("Tidak ada hasil pencarian untuk: " + keyword);
    }

    const firstResult = videoList[0];
    return [{
        thumbnail: firstResult.thumbnail || firstResult.image || '',
        url: firstResult.url,
        title: firstResult.title || firstResult.name || 'YouTube Music',
        type: 'audio'
    }];
}

module.exports = {
    btch
};

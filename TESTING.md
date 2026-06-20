# Yuuki Sorimachi — Testing Checklist

## Mode & Akses
- [✅] `.mode private` — non-sudo gak bisa pake bot?
- [✅] `.mode public` — semua bisa pake lagi?
- [✅] `.self on` — hanya fromMe (owner) yg bisa pake command?
- [✅] `.self off` — sudo bisa pake lagi?
- [✅] `.mode` (tanpa arg) — nampilin status?

## Sudo & Premium
- [✅] `.addsudo @user` — user masuk daftar sudo?
- [✅] `.listsudo` — nampilin daftar sudo?
- [✅] `.delsudo @user` — user kehapus dari sudo?
- [✅] `.sudo @user` (old toggle) — sinkron dengan .addsudo?
- [✅] `.addprem @user 30` — user jadi premium 30 hari?
- [✅] `.listprem` — daftar premium muncul?

## Auto Features
- [✅] `.autoread on` — centang biru otomatis di chat & grup?
- [✅] `.autoread off` — berhenti auto-read?
- [✅] `.autostatus on` + kirim status WA — otomatis di-view?
- [✅] `.autostatus off` — berhenti auto-view status?
- [✅] `.antidelete on` — hapus pesan, apakah bot kirim ulang?
- [✅] `.areact on` — bot react setiap command?
- [✅] `.areact off` — berhenti react?

## Broadcast (sudo harus bisa)
- [✅] `.bc test` sebagai **owner** — semua grup terima?
- [✅] `.bc test` sebagai **sudo** — semua grup terima? (dulu error)

## Owner Tools
- [✅] `.cleartmp` — folder temp bersih?
- [✅] `.clearsession` — folder session bersih + bot restart? (PERLU DIIMPLEMENTASIKAN)
- [✅] `.setpp` (reply gambar) — foto profil bot berubah?
- [✅] `.cleanup history` — History commands terhapus?
- [✅] `.debuglevelup` — test trigger level up?
- [✅] `.join https://chat.whatsapp.com/xxx` — bot masuk grup?
- [✅] `.leave` di grup — bot keluar?

## Info & Social
- [✅] `.topmembers` di grup — leaderboard muncul?
- [✅] `.leaderboard` / `.lb` — global ranking?
- [✅] `.flirt` — random pesan flirty?
- [✅] `.goodnight` / `.gn` — random goodnight message?
- [✅] `.ship @a @b` di grup — persentase cocok?

## Media Commands
- [✅] `.blur` (reply gambar) — gambar jadi blur?
- [✅] `.vv` (reply pesan view-once) — bisa dilihat?
- [✅] `.removebg` / `.rmbg` (reply gambar) — background kehapus?
- [✅] `.remini` / `.enhance` (reply gambar) — gambar lebih jernih?

## Downloader
- [✅] `.btch <url youtube>` — download video/audio YouTube?
- [✅] `.btch <url instagram>` — download IG post/reel?
- [✅] `.btch <url tiktok>` — download TikTok video/image?
- [✅] `.btch <url twitter/x>` — download X/Twitter media?
- [✅] `.btch <url facebook>` — download FB video?
- [✅] `.btch <url spotify>` — download Spotify track?
- [✅] `.btch <url pinterest>` — download Pinterest image?
- [✅] `.btch <url google drive>` — download Google Drive file?
- [✅] `.song <judul>` / `.music <judul>` — cari & download lagu?

## Converter
- [✅] `.sticker` / `.s` (reply gambar/video) — jadi sticker?
- [✅] `.toimage` / `.toimg` (reply sticker) — jadi gambar?
- [✅] `.tovideo` / `.tovid` (reply sticker) — jadi video?
- [✅] `.togif` / `.tgif` (reply sticker animasi) — jadi GIF?
- [✅] `.toaudio` / `.tomp3` (reply video) — jadi audio?
- [✅] `.stickercrop` / `.scrop` (reply sticker) — crop sticker?
- [✅] `.setwm <packname>` — set watermark sticker?

## AI Chat
- [✅] `.gpt <pertanyaan>` — GPT jawab?
- [✅] `.deepseek <pertanyaan>` — DeepSeek jawab?
- [✅] `.groq <pertanyaan>` — Groq AI jawab?

## Chatbot
- [✅] `.yuuki on` di grup — Yuuki auto-response aktif?
- [✅] `.yuuki off` di grup — Yuuki berhenti reply?
- [✅] `.yuuki` (tanpa arg) — nampilin status?
- [✅] Tag/mention Yuuki di grup — dia reply?
- [✅] Chat pribadi ke bot — Yuuki auto-response?

## Group Admin
- [✅] `.kick @user` — user ke-kick dari grup?
- [✅] `.tagall <teks>` — semua member ke-tag?
- [✅] `.hidetag <teks>` — tag semua tanpa notif?
- [✅] `.warn @user <alasan>` — user kena warn?
- [✅] `.warnings @user` — cek total warn user?
- [✅] `.resetwarn @user` — warn user di-reset?
- [✅] `.antilink on` — link grup lain ke-block?
- [✅] `.antitag on` — tag massal ke-block?
- [✅] `.antibadword on` — kata kasar ke-sensor?
- [✅] `.groupset status` — lihat pengaturan grup?
- [✅] `.mutegroup <menit>` — grup di-mute?
- [✅] `.unmutegroup` — grup di-unmute?
- [✅] `.welcome on` + `.welcome set <pesan>` — welcome message?
- [✅] `.goodbye on` + `.goodbye set <pesan>` — goodbye message?
- [✅] `.resetlink` — link grup di-reset?
- [✅] `.groupinfo` — info grup muncul?
- [✅] `.staff` / `.admins` — daftar admin?
- [✅] `.startabsen <judul>` — absen dimulai?
- [✅] `.absen` / `.absen <nama>` — absen masuk?
- [✅] `.finishabsen` — hasil absen keluar?

## Information
- [✅] `.meme` — meme random?
- [✅] `.joke` — joke random?
- [✅] `.quote` — kata bijak random (bisa anime/umum)?
- [✅] `.fact` — fakta unik?
- [✅] `.news` — berita terbaru?
- [✅] `.weather <kota>` — info cuaca?

## Search
- [✅] `.pinterest <query>` / `.pin <query>` — gambar dari Pinterest?
- [✅] `.lyrics <judul>` — lirik lagu?
- [✅] `.song <judul>` / `.music <judul>` — cari & download lagu?

## Tools
- [✅] `.translate <teks> <lang>` / `.trt` — terjemahan?
- [✅] `.ss <url>` / `.ssweb` — screenshot website?

## Profile
- [✅] `.mylevel` — level & XP muncul?
- [✅] `.mylevel @user` — level user lain?

## Ban
- [✅] `.ban @user` — user diblokir?
- [✅] `.unban @user` — user kebuka?

## Anime
- [✅] `.waifu` — gambar waifu random?
- [✅] `.waifu neko` — gambar neko random?
- [✅] `.waifu hug` / `.waifu kiss` / dll — interaksi anime?

## Yang SUDAH Dihapus (pastikan error "command tidak dikenal")
- [✅] `.surrender` — harusnya error
- [✅] `.pies` — harusnya error
- [✅] `.github` / `.git` — harusnya error
- [✅] `.emojimix` — harusnya error

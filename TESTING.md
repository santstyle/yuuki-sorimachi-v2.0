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
- [] `.autostatus on` + kirim status WA — otomatis di-view?
- [] `.autostatus off` — berhenti auto-view status?
- [✅] `.antidelete on` — hapus pesan, apakah bot kirim ulang?
- [✅] `.areact on` — bot react setiap command?
- [✅] `.areact off` — berhenti react?

## Broadcast (sudo harus bisa)
- [✅] `.bc test` sebagai **owner** — semua grup terima?
- [✅] `.bc test` sebagai **sudo** — semua grup terima? (dulu error)

## Owner Tools
- [✅] `.cleartmp` — folder temp bersih?
- [ ] `.clearsession` — folder session bersih + bot restart?
- [✅] `.setpp` (reply gambar) — foto profil bot berubah?
- [✅] `.cleanup history` — History commands terhapus?
- [✅] `.debuglevelup` — test trigger level up?
- [✅] `.join https://chat.whatsapp.com/xxx` — bot masuk grup?
- [✅] `.leave` di grup — bot keluar?

## Info & Social
- [✅] `.topmembers` di grup — leaderboard muncul?
- [✅] `.flirt` — random pesan flirty?
- [✅] `.goodnight` / `.gn` — random goodnight message?
- [✅] `.ship @a @b` di grup — persentase cocok?

## Media Commands
- [✅] `.blur` (reply gambar) — gambar jadi blur?
- [✅] `.vv` (reply pesan view-once) — bisa dilihat?
- [✅] `.removebg` / `.rmbg` (reply gambar) — background kehapus?
- [✅] `.remini` / `.enhance` (reply gambar) — gambar lebih jernih?

## Anime
- [✅] `.waifu` — gambar waifu random?
- [✅] `.quote` (anime) — gambar quote random?

## Ban
- [✅] `.ban @user` — user diblokir?
- [✅] `.unban @user` — user kebuka?

## Yang SUDAH Dihapus (pastikan error "command tidak dikenal")
- [✅] `.surrender` — harusnya error
- [✅] `.pies` — harusnya error
- [✅] `.github` / `.git` — harusnya error
- [✅] `.emojimix` — harusnya error

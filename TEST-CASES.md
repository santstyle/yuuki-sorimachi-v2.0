# Test Cases — Yuuki Sorimachi v2.4.0

> **Sebelum test:**
> - Bot harus sudah jalan dan terhubung ke WhatsApp
> - Siapkan 2 device: **Owner** (yang punya bot) dan **Member biasa**
> - Di dalam grup, pastikan ada minimal 1 admin selain owner
> - Catat chat ID grup dari log bot (format: `xxxxx@g.us`)

---

## 1. FITUR BOTMODE

### TC-BM-01: Lihat status botmode (default)
| | |
|---|---|
| **Siapa** | Admin grup |
| **Ketik** | `.botmode` |
| **Expected** | Bot reply: "Mode bot saat ini: *Public*" + panduan |

### TC-BM-02: Set botmode admin
| | |
|---|---|
| **Siapa** | Admin grup |
| **Ketik** | `.botmode admin` |
| **Expected** | Bot reply: "Mode bot di grup ini telah diubah menjadi *Admin*" |

### TC-BM-03: Cek status setelah diubah
| | |
|---|---|
| **Siapa** | Admin grup |
| **Ketik** | `.botmode` |
| **Expected** | Bot reply: "Mode bot saat ini: *Admin*" |

### TC-BM-04: Member biasa coba pakai bot (mode admin)
| | |
|---|---|
| **Siapa** | Member biasa (bukan admin) |
| **Ketik** | `.ping` |
| **Expected** | Bot **TIDAK RESPON** (diam saja) |

### TC-BM-05: Admin tetap bisa pakai bot (mode admin)
| | |
|---|---|
| **Siapa** | Admin grup |
| **Ketik** | `.ping` |
| **Expected** | Bot **RESPON** normal |

### TC-BM-06: Owner tetap bisa pakai bot (mode admin)
| | |
|---|---|
| **Siapa** | Owner bot |
| **Ketik** | `.ping` |
| **Expected** | Bot **RESPON** normal |

### TC-BM-07: Member coba set botmode (bukan admin)
| | |
|---|---|
| **Siapa** | Member biasa |
| **Ketik** | `.botmode public` |
| **Expected** | Bot reply: "Hanya admin yang bisa mengatur mode bot" |

### TC-BM-08: Set botmode public kembali
| | |
|---|---|
| **Siapa** | Admin grup |
| **Ketik** | `.botmode public` |
| **Expected** | Bot reply: "Mode bot di grup ini telah diubah menjadi *Public*" |

### TC-BM-09: Member bisa pakai bot lagi
| | |
|---|---|
| **Siapa** | Member biasa |
| **Ketik** | `.ping` |
| **Expected** | Bot **RESPON** normal |

### TC-BM-10: Input invalid
| | |
|---|---|
| **Siapa** | Admin grup |
| **Ketik** | `.botmode xyz` |
| **Expected** | Bot reply: "Gunakan `admin` atau `public`" |

### TC-BM-11: Mode sudah sama
| | |
|---|---|
| **Siapa** | Admin grup |
| **Ketik** | `.botmode public` (padahal sudah public) |
| **Expected** | Bot reply: "Mode bot sudah *Public* dari awal" |

### TC-BM-12: Botmode di private chat
| | |
|---|---|
| **Siapa** | Siapa saja |
| **Ketik** | `.botmode` (di private chat/DM) |
| **Expected** | Bot reply: "Command ini hanya bisa digunakan di grup" |

### TC-BM-13: Grup lain tidak terpengaruh
| | |
|---|---|
| **Setup** | Grup A: `.botmode admin`, Grup B: default (public) |
| **Test** | Member biasa ketik `.ping` di Grup B |
| **Expected** | Bot **RESPON** di Grup B (karena masih public) |

---

## 2. FITUR AFK

### TC-AFK-01: Set AFK tanpa alasan
| | |
|---|---|
| **Siapa** | User A |
| **Ketik** | `.afk` |
| **Expected** | Bot reply: "@userA AFK\nYuuki tetap di sini menunggu~" |

### TC-AFK-02: Set AFK dengan alasan
| | |
|---|---|
| **Siapa** | User A |
| **Ketik** | `.afk meeting jam 3` |
| **Expected** | Bot reply: "@userA AFK — meeting jam 3\nYuuki tetap di sini menunggu~" |

### TC-AFK-03: Mention user yang sedang AFK
| | |
|---|---|
| **Siapa** | User B |
| **Ketik** | `@userA ada yang ditanya` |
| **Expected** | Bot reply: "@userA AFK: meeting jam 3" |

### TC-AFK-04: Mention user AFK tanpa alasan
| | |
|---|---|
| **Setup** | User A set `.afk` (tanpa alasan) |
| **Siapa** | User B |
| **Ketik** | `@userA cek ini ya` |
| **Expected** | Bot reply: "@userA AFK" (tanpa keterangan alasan) |

### TC-AFK-05: User AFK kirim pesan (clear AFK)
| | |
|---|---|
| **Siapa** | User A (sedang AFK) |
| **Ketik** | `udah ya` (pesan biasa, bukan command) |
| **Expected** | Bot reply: "@userA sudah pulang (X jam Y menit). Yuuki senang Tuan kembali~" |

### TC-AFK-06: User AFK kirim command (TIDAK clear AFK)
| | |
|---|---|
| **Siapa** | User A (sedang AFK) |
| **Ketik** | `.ping` |
| **Expected** | Bot **TIDAK clear AFK** — AFK tetap aktif (karena command punya `.` prefix) |

### TC-AFK-07: Clear AFK otomatis bekerja
| | |
|---|---|
| **Setup** | User A sudah clear AFK (TC-AFK-05) |
| **Siapa** | User B |
| **Ketik** | `@userA halo` |
| **Expected** | Bot **TIDAK** kirim pesan AFK (karena sudah tidak AFK) |

### TC-AFK-08: AFK di private chat
| | |
|---|---|
| **Siapa** | User A (di DM) |
| **Ketik** | `.afk istirahat` |
| **Expected** | Bot reply: "@userA AFK — istirahat\nYuuki tetap di sini menunggu~" |

### TC-AFK-09: Durasi AFK terhitung benar
| | |
|---|---|
| **Setup** | User A set `.afk` di menit ke-0. Tunggu 5 menit. User A kirim pesan. |
| **Expected** | Bot reply mengandung "5 menit" |

### TC-AFK-10: Multiple user AFK
| | |
|---|---|
| **Setup** | User A: `.afk`, User B: `.afk kerja` |
| **Siapa** | User C |
| **Ketik** | `@userA @userB halo` |
| **Expected** | Bot reply AFK untuk user pertama yang ditemukan (break setelah 1) |

---

## 3. FITUR LAINNYA (Quick Check)

### TC-OTHER-01: XP & Level Up (Private Chat Only)
| | |
|---|---|
| **Siapa** | User (di DM) |
| **Ketik** | Pesan biasa (bukan command) berulang kali |
| **Expected** | XP bertambah per pesan (5-15 XP). Level up notif muncul setiap 10 level |

### TC-OTHER-02: XP TIDAK di grup
| | |
|---|---|
| **Siapa** | User (di grup) |
| **Ketik** | Pesan biasa di grup |
| **Expected** | XP **TIDAK** bertambah (sistem hanya hitung di DM) |

### TC-OTHER-03: Menu
| | |
|---|---|
| **Ketik** | `.menu` atau `.help` |
| **Expected** | Bot tampilkan daftar semua command per kategori |

### TC-OTHER-04: Ping
| | |
|---|---|
| **Ketik** | `.ping` |
| **Expected** | Bot reply dengan waktu respon |

### TC-OTHER-05: Mylevel
| | |
|---|---|
| **Ketik** | `.mylevel` |
| **Expected** | Bot tampilkan level & XP user |

### TC-OTHER-06: Leaderboard
| | |
|---|---|
| **Ketik** | `.leaderboard` |
| **Expected** | Bot tampilkan peringkat top users |

---

## 4. GLOBAL MODE vs BOTMODE (Interaksi)

### TC-GLOBAL-01: Self mode override
| | |
|---|---|
| **Setup** | Owner set `.mode self` + Grup A: `.botmode public` |
| **Test** | Member biasa ketik `.ping` di Grup A |
| **Expected** | Bot **TIDAK RESPON** (global self mode lebih prioritas) |

### TC-GLOBAL-02: Public mode + botmode admin
| | |
|---|---|
| **Setup** | Mode global: public + Grup A: `.botmode admin` |
| **Test** | Member biasa ketik `.ping` di Grup A |
| **Expected** | Bot **TIDAK RESPON** (botmode admin membatasi) |

### TC-GLOBAL-03: Owner bypass semua mode
| | |
|---|---|
| **Setup** | Mode global: self + Grup A: `.botmode admin` |
| **Test** | Owner ketik `.ping` di Grup A |
| **Expected** | Bot **RESPON** (owner bypass) |

### TC-GLOBAL-04: Sudo bypass semua mode
| | |
|---|---|
| **Setup** | Mode global: self + Grup A: `.botmode admin` |
| **Test** | Sudo user ketik `.ping` di Grup A |
| **Expected** | Bot **RESPON** (sudo bypass) |

---

## 5. LID NORMALIZATION (Regression Test)

### TC-LID-01: Command di grup tidak error
| | |
|---|---|
| **Siapa** | Admin (dengan JID `@lid` format) |
| **Ketik** | `.warn @user` di grup |
| **Expected** | Command jalan tanpa error, warning tersimpan |

### TC-LID-02: Cek level di grup
| | |
|---|---|
| **Siapa** | User (dengan JID `@lid` format) |
| **Ketik** | `.mylevel` |
| **Expected** | Bot tampilkan level & XP tanpa error |

### TC-LID-03: Sudo list tidak duplikat
| | |
|---|---|
| **Ketik** | `.listsudo` |
| **Expected** | Hanya tampilkan JID `@s.whatsapp.net`, tidak ada duplikat `@lid` |

---

## CATATAN

- **TC-BM-04** adalah test paling penting untuk botmode — pastikan bot benar-benar diam
- **TC-AFK-06** penting untuk memastikan command `.afk` tidak clear AFK secara tidak sengaja
- **TC-GLOBAL-03** dan **TC-GLOBAL-04** memastikan owner/sudo selalu bypass
- Jalankan test secara **berurutan** per section
- Setelah selesai, pastikan botmode dikembalikan ke `public` agar tidak mengganggu member

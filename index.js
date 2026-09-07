const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const fs = require('fs')

const SESSION_FOLDER = 'auth_info'
const RATE_FAST = 150
const RATE_GIFT = 87
const RATE_VERMUK = 7000
const RATE_BULK = 5000
const ADMIN_NUMBER = '628886326382@s.whatsapp.net' // NOMOR ADMIN
const BOT_NUMBER = '6285834587620' // NOMOR BOT
const ORDERS_FILE = 'orders.json'

let tempOrders = {}
let orders = []

// Load data order kalau ada
if(fs.existsSync(ORDERS_FILE)) {
    orders = JSON.parse(fs.readFileSync(ORDERS_FILE))
}

// Fungsi simpan order
function saveOrder(order) {
    orders.push(order)
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2))
}

// Fungsi rekap harian
function getRekapHarian() {
    const today = new Date().toLocaleDateString('id-ID')
    const todayOrders = orders.filter(o => o.tanggal === today)
    const totalOrder = todayOrders.length
    const totalOmzet = todayOrders.reduce((sum, o) => sum + o.total, 0)
    return { tanggal: today, totalOrder, totalOmzet, detail: todayOrders }
}

async function startBot() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER)
    const sock = makeWASocket({ version, auth: state, printQRInTerminal: true })
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        if(qr) {
            console.log('================= SCAN QR INI DI WA =================')
            qrcode.generate(qr, {small: true})
            console.log('====================================================')
        }
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode!== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('✅ BOT DORAEMON STORE SUDAH ONLINE!')
        }
    })

    const showMenu = (from) => {
        let menuText = `👋 *SELAMAT DATANG DI DORAEMON STORE*\n\n*MENU UTAMA*\n\n1️⃣ *ORDER*\n2️⃣ *CEK HARGA*\n3️⃣ *CEK STOCK*\n4️⃣ *CEK PESAN*\n5️⃣ *CARA PEMBAYARAN*\n6️⃣ *HUBUNGI ADMIN*`

        // Kalau admin, tambah menu rekap
        if(from === ADMIN_NUMBER) {
            menuText += `\n\n*MENU ADMIN*\n7️⃣ *REKAP HARIAN*\n8️⃣ *REKAP OMZET*`
        }

        menuText += `\n\nKetik angka menu nya contoh: 1`
        return sock.sendMessage(from, { text: menuText })
    }

    sock.ev.on('messages.upsert', async (m) => {
        if(!m.messages) return
        const msg = m.messages[0]
        if(msg.key.fromMe) return
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text
        const from = msg.key.remoteJid

        // Reset kalau ketik menu
        if(text?.toLowerCase() === 'menu') { delete tempOrders[from]; return showMenu(from) }

        if(!tempOrders[from]) tempOrders[from] = { step: 0 }
        let user = tempOrders[from]

        // ================== MENU 1: ORDER ==================
        if(text === '1' && user.step === 0) {
            user.step = 1
            return sock.sendMessage(from, {
                text: `*PILIH PRODUK*\n\n` +
                      `1. VISEND FAST R150\n` +
                      ` >> ROBUX VIA USERNAME\n` +
                      `2. GIFT IN GAME R87\n` +
                      `3. VERMUK & BULK ACC\n` +
                      `Ketik angka produk: 1 / 2 / 3`
            })
        }

        // VISEND FAST
        if(text === '1' && user.step === 1) {
            user.produk = 'VISEND FAST R150'
            user.rate = RATE_FAST
            user.step = 2
            return sock.sendMessage(from, {
                text: `🟦 *1. VISEND FAST — R150*\n` +
                      `💎 *ROBUX VIA USERNAME*\n\n` +
                      `Silakan masukkan:\n` +
                      `👤 *USERNAME = DISPLAY*\n` +
                      `Contoh: d0r43m0n20 = doraemon\n` +
                      `⚠️ *PENTING:* Pastikan Username & Display Name sudah sesuai dengan akun Roblox.\n` +
                      `❗ *Kesalahan penulisan data menjadi tanggung jawab pembeli dan dapat menyebabkan proses tidak sesuai.*\n\n` +
                      `>> USERNAME=DISPLAY :`
            })
        }

        // GIFT IN GAME
        if(text === '2' && user.step === 1) {
            user.produk = 'GIFT IN GAME R87'
            user.rate = RATE_GIFT
            user.step = 5
            return sock.sendMessage(from, {
                text: `🎁 *GIFT IN GAME*\n` +
                      `💰 *RATE R87* Total pembayaran = Total Robux × 87\n` +
                      `📌 *Cara Order:* Silakan kirim Link PS terlebih dahulu, kemudian isi format berikut:\n\n` +
                      `🔗 Link PS: \n` +
                      `👤 Username: \n` +
                      `🏷️ Display Name:\n\n` +
                      `*Contoh:*\n` +
                      `🔗 Link PS: [link]\n` +
                      `👤 Username: doraemon123\n` +
                      `🏷️ Display Name: Doraemon\n` +
                      `✅ *Pastikan data yang dikirim sudah benar sebelum order diproses.*\n` +
                      `⚡ *DORAEMON STORE Sat Set • Fast Process*\n\n` +
                      `Kirim format lengkapnya sekarang:`
            })
        }

        // VERMUK & BULK
        if(text === '3' && user.step === 1) {
            user.step = 7
            return sock.sendMessage(from, {
                text: `🟨 *VERMUK & BULK ACC*\n` +
                      `🔥 *VERMUK* 💰 Rp7.000 / ACC\n` +
                      `📦 *BULK ACC* 💰 Rp5.000 / ACC\n` +
                      `━━━━━━━━━━━━━━\n` +
                      `🛒 *FORMAT ORDER*\n` +
                      `👤 Username / ID:.........................\n` +
                      `📦 Jumlah ACC:.........................\n` +
                      `📌 Layanan: VERMUK / BULK\n` +
                      `*Kirim format lengkapnya sekarang:*`
            })
        }

        // INPUT VERMUK/BULK
        if(user.step === 7) {
            if(text.includes('Username') && text.includes('Jumlah') && text.includes('Layanan')) {
                user.dataVermuk = text
                if(text.toLowerCase().includes('bulk')) {
                    user.produk = 'BULK ACC'
                    user.rate = RATE_BULK
                } else {
                    user.produk = 'VERMUK'
                    user.rate = RATE_VERMUK
                }

                let jumlahMatch = text.match(/Jumlah ACC:\s*(\d+)/i)
                user.jumlah = jumlahMatch? parseInt(jumlahMatch[1]) : 1
                user.total = user.jumlah * user.rate
                user.step = 4

                return sock.sendMessage(from, {
                    text: `*RINCIAN ORDER*\n\n` +
                          `Produk : ${user.produk}\n` +
                          `Data :\n${user.dataVermuk}\n` +
                          `Jumlah : ${user.jumlah} ACC\n` +
                          `Rate : Rp${user.rate.toLocaleString('id-ID')}\n` +
                          `*TOTAL : Rp${user.total.toLocaleString('id-ID')}*\n\n` +
                          `1. KONFIRMASI ORDER\n` +
                          `2. BATAL\n` +
                          `Ketik 1 untuk lanjut ke pembayaran`
                })
            } else {
                return sock.sendMessage(from, { text: `Format salah! Kirim sesuai format:\n👤 Username / ID: \n📦 Jumlah ACC: \n📌 Layanan: VERMUK / BULK` })
            }
        }

        // INPUT GIFT IN GAME
        if(user.step === 5 && text.includes('Link PS')) {
            user.dataGift = text
            user.step = 6
            return sock.sendMessage(from, {
                text: `*MASUKKAN JUMLAH ROBUX*\n\nContoh: 100, 200, 300, 400, 500, 1000`
            })
        }

        // INPUT JUMLAH UNTUK FAST
        if(user.step === 2 && text.includes('=')) {
            user.username = text
            user.step = 3
            return sock.sendMessage(from, {
                text: `*MASUKKAN JUMLAH ROBUX*\n\nContoh: 100, 200, 300, 400, 500, 1000`
            })
        }

        // INPUT JUMLAH + HITUNG OTOMATIS FAST & GIFT
        if((user.step === 3 || user.step === 6) &&!isNaN(text)) {
            user.jumlah = parseInt(text)
            user.total = user.jumlah * user.rate
            user.step = 4

            let detail = user.produk === 'VISEND FAST R150'
          ? `Username : ${user.username}`
            : `Data :\n${user.dataGift}`

            return sock.sendMessage(from, {
                text: `*RINCIAN ORDER*\n\n` +
                      `Produk : ${user.produk}\n` +
                      `${detail}\n` +
                      `Jumlah : ${user.jumlah} Robux\n` +
                      `Rate : Rp${user.rate}\n` +
                      `*TOTAL : Rp${user.total.toLocaleString('id-ID')}*\n\n` +
                      `1. KONFIRMASI ORDER\n` +
                      `2. BATAL\n\n` +
                      `Ketik 1 untuk lanjut ke pembayaran`
            })
        }

        // KONFIRMASI + SIMPAN KE REKAP
        if(text === '1' && user.step === 4) {
            user.step = 0
            const orderId = `DRR-${Math.floor(Math.random()*10000)}`
            const tanggal = new Date().toLocaleDateString('id-ID')
            const jam = new Date().toLocaleTimeString('id-ID')

            // SIMPAN ORDER
            saveOrder({
                id: orderId,
                tanggal,
                jam,
                produk: user.produk,
                jumlah: user.jumlah,
                total: user.total,
                nomor: from
            })

            return sock.sendMessage(from, {
                text: `*ORDER BERHASIL DIBUAT*\n\n` +
                      `ID Order : ${orderId}\n` +
                      `Produk : ${user.produk}\n` +
                      `Jumlah : ${user.jumlah} ${user.produk.includes('ACC')? 'ACC' : 'Robux'}\n` +
                      `TOTAL BAYAR : Rp${user.total.toLocaleString('id-ID')}\n\n` +
                      `Silakan lakukan pembayaran. Ketik 5 untuk lihat cara bayar`
            })
        }

        // ================== MENU 2: CEK HARGA ==================
        if(text === '2') {
            return sock.sendMessage(from, {
                text: `💰 *CEK HARGA — DORAEMON STORE*\n\n` +
                      `🟦 *VISEND FAST*\n` +
                      `💎 Rate R150\n` +
                      `➡️ Robux × 150\n` +
                      `🎁 *GIFT IN GAME*\n` +
                      `💎 Rate R87\n` +
                      `➡️ Robux × 87\n` +
                      `🟨 *VERMUK*\n` +
                      `💰 Rp7.000 / ACC\n` +
                      `📦 *BULK ACC*\n` +
                      `💰 Rp5.000 / ACC\n` +
                      `━━━━━━━━━━━━━━\n` +
                      `⚡ *FAST PROCESS • SAT SET*\n` +
                      `🤖 *DORAEMON STORE*`
            })
        }

        // ================== MENU 3: CEK STOCK ==================
        if(text === '3') {
            user.step = 10
            return sock.sendMessage(from, {
                text: `📦 *CEK STOCK DORAEMON STORE*\n\n` +
                      `Silakan pilih produk:\n\n` +
                      `1. *VISEND FAST*\n` +
                      `2. *GIFT IN GAME*\n\n` +
                      `Ketik angka: 1 / 2`
            })
        }

        if(text === '1' && user.step === 10) {
            user.step = 0
            return sock.sendMessage(from, {
                text: `📦 *STOCK VISEND FAST*\n\n` +
                      `✅ *STOCK TERSEDIA*\n\n` +
                      `*Rate:* R150\n` +
                      `*Proses:* 1-5 Menit\n` +
                      `*Status:* OPEN 24 JAM\n` +
                      `Ketik 1 untuk order sekarang`
            })
        }

        if(text === '2' && user.step === 10) {
            user.step = 0
            return sock.sendMessage(from, {
                text: `📦 *STOCK GIFT IN GAME*\n\n` +
                      `✅ *STOCK TERSEDIA*\n\n` +
                      `*Rate:* R87\n` +
                      `*Proses:* 5-15 Menit\n` +
                      `*Status:* OPEN 24 JAM\n` +
                      `Ketik 1 untuk order sekarang`
            })
        }

        // ================== MENU 4: CEK PESAN ==================
        if(text === '4') {
            return sock.sendMessage(from, {
                text: `*CEK PESAN*\n\nFitur ini masih manual. Hubungi admin untuk cek status order kamu ya.`
            })
        }

        // ================== MENU 5: CARA PEMBAYARAN ==================
        if(text === '5') {
            return sock.sendMessage(from, {
                text: `📢 *Informasi Pembayaran:* \n\n` +
                      `*PAYMENT*\n\n` +
                      `➥ *SEABANK* : 901800393314\n` +
                      `➥ *DANA* : 082229428801 \n` +
                      `*Semua A/N*\n` +
                      `*SELAMET HARIANTO*\n\n` +
                      `*Sama qr itu mas*\n\n` +
                      `Setelah transfer kirim bukti ke admin. Ketik 6`
            })
        }

        // ================== MENU 6: HUBUNGI ADMIN ==================
        if(text === '6') {
            return sock.sendMessage(from, {
                text: `*HUBUNGI ADMIN*\n\n` +
                      `Admin Doraemon Store\n` +
                      `WA: 628886326382\n` +
                      `Jam operasional: 08.00 - 22.00 WIB`
            })
        }

        // ================== MENU ADMIN 7: REKAP HARIAN ==================
        if(text === '7' && from === ADMIN_NUMBER) {
            const rekap = getRekapHarian()
            return sock.sendMessage(from, {
                text: `✅ *REKAP PENJUALAN HARIAN*\n\n` +
                      `📅 Tanggal: ${rekap.tanggal}\n` +
                      `📦 Total Order: ${rekap.totalOrder}\n` +
                      `💰 Total Omzet: Rp${rekap.totalOmzet.toLocaleString('id-ID')}\n\n` +
                      `*DETAIL ORDER:*\n` +
                      rekap.detail.map(o => `#${o.id} - ${o.produk} - Rp${o.total.toLocaleString('id-ID')}`).join('\n') || 'Belum ada order hari ini'
            })
        }

        // ================== MENU ADMIN 8: REKAP OMZET ==================
        if(text === '8' && from === ADMIN_NUMBER) {
            const totalOmzet = orders.reduce((sum, o) => sum + o.total, 0)
            const totalOrder = orders.length
            return sock.sendMessage(from, {
                text: `✅ *REKAP OMZET KESELURUHAN*\n\n` +
                      `📦 Total Order: ${totalOrder}\n` +
                      `💰 Total Omzet: Rp${totalOmzet.toLocaleString('id-ID')}\n\n` +
                      `Data tersimpan otomatis di server`
            })
        }

        // Default
        if(user.step === 0) showMenu(from)
    })
}

startBot()

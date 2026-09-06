const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { state, saveState } = useSingleFileAuthState('./session.json')
const pino = require('pino')
const fs = require('fs')

const NOMOR_BOT = "6282229428801" // NOMOR BOT KAMU PAKE 62
const ADMIN_WA = "628886326382" // NOMOR OWNER/ADMIN PAKE 62
const NAMA_STORE = "DORAEMON STORE"
let orders = {} // Simpan order sementara

const produk = [
    { id: 1, nama: "R148", harga: 20000 },
    { id: 2, nama: "PO R135", harga: 19000 },
    { id: 3, nama: "VISEND FAST R148", harga: 21000 },
    { id: 4, nama: "VISEND PO R135", harga: 19500 },
]

const hargaRobux = [
    { jumlah: 500, harga: 37000 },
    { jumlah: 1000, harga: 74000 },
    { jumlah: 1800, harga: 130000 },
    { jumlah: 2000, harga: 145000 },
]

async function startBot() {
    const sock = makeWASocket({
        logger: pino({ level: 'info' }),
        auth: state,
        browser: ['DORAEMON STORE', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000
    })
    sock.ev.on('creds.update', saveState)

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase().trim()

        // MENU UTAMA
        if (text === 'menu' || text === '') {
            return sock.sendMessage(from, { text:
`DORAEMON STORE ROBLOX
MENU UTAMA
1. daftar - Lihat daftar harga
2. status - Cek status pesanan
3. payment - Informasi pembayaran
4. carabeli - Cara melakukan pembelian
5. order - Buat pesanan baru
6. admin - Hubungi admin
7. bot - Info nomor bot

Gunakan command sesuai kebutuhan Anda.` })
        }

        // DAFTAR HARGA
        if (text === 'daftar') {
            let list = "PRICE LIST ROBUX 💎\n\n"
            hargaRobux.forEach(r => list += `${r.jumlah} Robux = Rp${r.harga.toLocaleString('id-ID')}\n`)
            list += "\nVia Gamepass / Login"
            return sock.sendMessage(from, { text: list })
        }

        // ORDER
        if (text === 'order') {
            orders[from] = { step: 1 }
            let prodList = "BUAT ORDER\nPILIH PRODUK\n"
            produk.forEach(p => prodList += `${p.id}. ${p.nama}\n`)
            prodList += "\nBalas dengan angka.\n*Ketik batal untuk membatalkan."
            return sock.sendMessage(from, { text: prodList })
        }

        // FLOW ORDER
        if (orders[from]) {
            let o = orders[from]

            if (o.step === 1) {
                if (text === 'batal') { delete orders[from]; return sock.sendMessage(from, { text: "Order dibatalkan" }) }
                let pilih = produk.find(p => p.id == text)
                if (!pilih) return sock.sendMessage(from, { text: "Pilihan tidak valid" })
                o.produk = pilih
                o.step = 2
                return sock.sendMessage(from, { text: `PRODUK: ${pilih.nama}\n\nMASUKKAN USERNAME ROBLOX\nContoh: AsepGaming123\n*Ketik batal untuk membatalkan.` })
            }

            if (o.step === 2) {
                if (!/^[a-zA-Z0-9_]{3,20}$/.test(text)) {
                    return sock.sendMessage(from, { text: `Username tidak valid.\nUsername Roblox hanya boleh huruf, angka, titik, underscore (3-20 karakter).\nSilakan masukkan kembali.` })
                }
                o.username = text
                o.step = 3
                return sock.sendMessage(from, { text: `USERNAME: ${text}\n\nMASUKKAN JUMLAH ROBUX\nContoh:\n500\n1000\n1800\n2000\n*Ketik batal untuk membatalkan.` })
            }

            if (o.step === 3) {
                let jml = parseInt(text)
                let hr = hargaRobux.find(h => h.jumlah === jml)
                if (!hr) return sock.sendMessage(from, { text: "Jumlah tidak ada di list. Pilih 500/1000/1800/2000" })
                o.jumlah = jml
                o.total = hr.harga
                o.step = 4
                o.orderId = "DRB-" + Math.floor(100000 + Math.random() * 900000)

                return sock.sendMessage(from, { text:
`KONFIRMASI ORDER
USERNAME: ${o.username}
JUMLAH ROBUX: ${o.jumlah} Robux
PRODUK: ${o.produk.nama}
HARGA: Rp${o.total.toLocaleString('id-ID')}

Balas:
1. KONFIRMASI
2. BATAL` })
            }

            if (o.step === 4) {
                if (text === '1') {
                    let link = `https://wa.me/${ADMIN_WA}?text=Halo%20Admin%20${encodeURIComponent(NAMA_STORE)}%0A%0ASaya%20sudah%20melakukan%20pembayaran.%0A%0AOrder%20ID%20:%20${o.orderId}%0AUsername%20Roblox%20:%20${o.username}%0AJumlah%20Robux%20:%20${o.jumlah}%0AProduk%20:%20${o.produk.nama}%0ATotal%20:%20Rp${o.total.toLocaleString('id-ID')}%0A%0ASaya%20akan%20mengirimkan%20bukti%20pembayaran`

                    sock.sendMessage(from, { text:
`PEMBAYARAN
ORDER ID: ${o.orderId}
JUMLAH: ${o.jumlah} Robux
TOTAL: Rp${o.total.toLocaleString('id-ID')}

Silakan lakukan pembayaran sesuai total order.
Setelah pembayaran selesai, klik link dibawah untuk chat admin.` })
                    sock.sendMessage(from, { text: `Link WhatsApp Admin:\n${link}` })
                    delete orders[from]
                } else {
                    delete orders[from]
                    sock.sendMessage(from, { text: "Order dibatalkan" })
                }
            }
        }

        // COMMAND LAIN - UDAH DIUPDATE
        if (text === 'status') sock.sendMessage(from, { text: "Kirim Order ID kamu ke admin untuk cek status" })
        if (text === 'payment') sock.sendMessage(from, { text:
`📢 INFORMASI PEMBAYARAN

*PAYMENT*

➥ SEABANK : 901800393314
➥ DANA : 082229428801
Semua A/N *SELAMET HARIANTO*

Setelah transfer langsung ketik.admin buat kirim bukti` })
        if (text === 'carabeli') sock.sendMessage(from, { text: "1. Ketik order\n2. Pilih produk\n3. Isi username + jumlah\n4. Transfer\n5. Kirim bukti ke admin" })
        if (text === 'admin') sock.sendMessage(from, { text: `Hubungi Owner/Admin:\nhttps://wa.me/${ADMIN_WA}` })
        if (text === 'bot') sock.sendMessage(from, { text: `Nomor Bot DORAEMON STORE:\nhttps://wa.me/${NOMOR_BOT}` })
    })

    sock.ev.on('connection.update', (u) => {
        if (u.connection === 'close') startBot()
    })
}
startBot()

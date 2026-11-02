# Vehicle Log

Web MVP untuk melacak perawatan kendaraan (oli, spare part) dan jadwal pajak Indonesia (tahunan & 5 tahun). Data disimpan lokal di browser dengan backup JSON.

## Menjalankan

```bash
npm install
npm run dev
```

Buka URL yang ditampilkan di terminal (biasanya `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Fitur

- Dashboard: peringatan pajak jatuh tempo & oli terakhir
- Kendaraan: CRUD + jadwal pajak PKB tahunan & STNK 5 tahun
- Perawatan: ganti oli, spare part, riwayat dengan filter
- Pengaturan: hari pengingat default, export/import JSON

Data tidak dikirim ke server. Cadangkan lewat **Pengaturan → Export JSON**.

## GitHub Pages

1. Buat repo GitHub bernama **`vehicle-log`** (nama harus sama agar path `/vehicle-log/` benar).
2. Push branch `main` (atau `master` — workflow mendukung keduanya).
3. Di repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Setelah workflow sukses, buka `https://<username-github>.github.io/vehicle-log/`.

Jika nama repo berbeda, ubah `repoBase` di [`vite.config.ts`](vite.config.ts).

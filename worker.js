// File: worker.js (Diperbarui untuk Approval Flow)

const { readDatabase, writeDatabase } = require("./db-handler.js");
const { parseStats } = require("./utils.js");
const axios = require("axios");
const { parentPort } = require("worker_threads");
const { apiKey } = require("./config.json");

function log(message) {
  /* ... (fungsi log tetap sama) ... */
}

async function updateAllCampaignStats() {
  log(`Menjalankan update stats campaign...`);
  let db = await readDatabase();
  let changesMade = false;

  for (const campaignId of Object.keys(db.dataCampaigns)) {
    const campaign = db.dataCampaigns[campaignId];
    // log(`[DEBUG] Mengecek Campaign ID: ${campaignId}, Judul: ${campaign.title}`);

    // --- LOGIKA PENGECEKAN CAMPAIGN TETAP SAMA ---
    if (
      !campaign.isActive ||
      !campaign.submissions ||
      campaign.submissions.length === 0
    ) {
      continue;
    }
    // (Worker tidak lagi menonaktifkan campaign karena budget habis, itu dilakukan saat accept)
    // if (campaign.budgetRemaining <= 0 && campaign.payoutType === 'view') { ... } // Hapus blok ini

    for (const submission of campaign.submissions) {
      // Hanya proses submission yang BELUM final (pending atau sudah accepted)
      if (submission.status === "rejected") continue;

      // log(`[DEBUG] Mengecek Submission: User ${submission.userId}, Video ${submission.videoUrl}, Status: ${submission.status}`);
      try {
        const response = await axios.get(
          "https://api.alyachan.dev/api/tiktok",
          {
            params: { url: submission.videoUrl, apikey: apiKey },
          }
        );

        if (response.data && response.data.status && response.data.stats) {
          const apiStats = response.data.stats;
          const newLikes = parseStats(apiStats.likes);
          const newViews = parseStats(apiStats.views);
          // log(`[DEBUG] Parsed Stats: newLikes=${newLikes}, newViews=${newViews}`);
          // log(`[DEBUG] DB Stats Saat Ini: currentLikes=${submission.currentLikes}, currentViews=${submission.currentViews}`);

          // Cek jika ada perubahan stats
          if (
            submission.currentLikes !== newLikes ||
            submission.currentViews !== newViews
          ) {
            changesMade = true;

            // --- LOGIKA HITUNG POTENSI EARNING (TIPE VIEW) ---
            if (campaign.payoutType === "view") {
              const rate = campaign.ratePer1mViews || 0;
              const ratePerView = rate / 1000000;
              // Hitung TOTAL potensi earning berdasarkan views SAAT INI
              const totalPotentialEarning = newViews * ratePerView;

              // Update totalEarnings di submission (BUKAN balance user)
              submission.totalEarnings = totalPotentialEarning;
              // log(`[DEBUG] Update Potensi Earning Video ${submission.submissionId}: $${submission.totalEarnings}`);
            }
            // --- BATAS LOGIKA EARNING ---

            submission.currentLikes = newLikes;
            submission.currentViews = newViews;
            submission.lastChecked = new Date().toISOString();
          } else if (submission.status !== "accepted") {
            // Jika tidak ada perubahan stats, tapi statusnya masih pending
            // update lastChecked saja agar tidak numpuk error FAILED
            submission.lastChecked = new Date().toISOString();
            changesMade = true;
          }
        } else {
          log(`[WARN] Respons API tidak valid untuk ${submission.videoUrl}`);
          submission.lastChecked = `FAILED_INVALID_RESPONSE: ${new Date().toISOString()}`;
          changesMade = true;
        }
      } catch (error) {
        log(
          `[ERROR] Gagal update stats untuk ${submission.videoUrl}: ${error.message}`
        );
        submission.lastChecked = `FAILED_AXIOS_ERROR: ${new Date().toISOString()}`;
        changesMade = true;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  if (changesMade) {
    await writeDatabase(db);
    log(`Update stats campaign selesai. Perubahan disimpan.`);
  } else {
    log(`Update stats campaign selesai. Tidak ada perubahan.`);
  }
}

// ... (startCampaignMonitor tetap sama) ...
function startCampaignMonitor() {
  /* ... */
}
startCampaignMonitor();

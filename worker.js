// File: worker.js
// Ini adalah file terpisah yang HANYA bertugas mengurus update background task

const { readDatabase, writeDatabase } = require("./db-handler.js");
const { parseStats } = require("./utils.js");
const axios = require("axios");
const { parentPort } = require("worker_threads"); // Untuk komunikasi

// Fungsi log untuk mengirim pesan ke thread utama (index.js)
function log(message) {
  // Cetak ke konsol worker sendiri
  console.log(message);

  // Kirim juga ke bot utama agar bisa dilihat di log utama
  if (parentPort) {
    parentPort.postMessage(`[WORKER] ${message}`);
  } else {
    // Jika dijalankan langsung (bukan sebagai worker)
    // console.log(`[WORKER-SOLO] ${message}`);
  }
}

async function updateAllCampaignStats() {
  log(`[${new Date().toISOString()}] Menjalankan update stats campaign...`);
  let db = await readDatabase();
  let changesMade = false;

  for (const campaignId of Object.keys(db.dataCampaigns)) {
    const campaign = db.dataCampaigns[campaignId];

    if (
      !campaign.isActive ||
      !campaign.submissions ||
      campaign.submissions.length === 0
    ) {
      continue;
    }
    if (campaign.budgetRemaining <= 0 && campaign.payoutType === "view") {
      if (campaign.isActive) {
        campaign.isActive = false;
        changesMade = true;
        log(`[INFO] Campaign ${campaign.id} dinonaktifkan (budget habis).`);
      }
      continue;
    }

    for (const submission of campaign.submissions) {
      try {
        const response = await axios.get(
          "https://api.alyachan.dev/api/tiktok",
          {
            params: { url: submission.videoUrl, apikey: "aiscya" },
          }
        );

        if (response.data && response.data.status && response.data.stats) {
          const newLikes = parseStats(response.data.stats.likes);
          const newViews = parseStats(response.data.stats.views);

          if (
            submission.currentLikes !== newLikes ||
            submission.currentViews !== newViews
          ) {
            if (
              campaign.payoutType === "view" &&
              newViews > submission.currentViews
            ) {
              const viewsSinceLastCheck = newViews - submission.currentViews;
              const rate = campaign.ratePer1mViews || 0;
              const ratePerView = rate / 1000000;
              const earningsThisInterval = viewsSinceLastCheck * ratePerView;

              let finalEarnings = 0;
              if (campaign.budgetRemaining >= earningsThisInterval) {
                finalEarnings = earningsThisInterval;
                campaign.budgetRemaining -= earningsThisInterval;
              } else {
                finalEarnings = campaign.budgetRemaining;
                campaign.budgetRemaining = 0;
                campaign.isActive = false;
              }

              const userToPay = db.dataUser[submission.userId];
              if (userToPay) {
                if (!userToPay.balance) userToPay.balance = 0;
                userToPay.balance += finalEarnings;
                submission.totalEarnings += finalEarnings;
              }
            }
            submission.currentLikes = newLikes;
            submission.currentViews = newViews;
            submission.lastChecked = new Date().toISOString();
            changesMade = true;
          }
        }
      } catch (error) {
        log(
          `Gagal update stats untuk ${submission.videoUrl}: ${error.message}`
        );
        submission.lastChecked = `FAILED: ${new Date().toISOString()}`;
        changesMade = true;
      }
      // Jeda 2 detik antar API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  if (changesMade) {
    await writeDatabase(db);
    log(
      `[${new Date().toISOString()}] Update stats campaign selesai. Perubahan disimpan.`
    );
  } else {
    log(
      `[${new Date().toISOString()}] Update stats campaign selesai. Tidak ada perubahan.`
    );
  }
}

function startCampaignMonitor() {
  const updateInterval = 3600 * 1000; // 1 Jam

  log("[INFO] Update campaign stats pertama akan berjalan dalam 5 detik...");
  setTimeout(updateAllCampaignStats, 5000);

  setInterval(updateAllCampaignStats, updateInterval);
  log(
    `[INFO] Monitor campaign stats telah diatur. Update setiap ${
      updateInterval / 60000
    } menit.`
  );
}

// Langsung jalankan monitor saat file worker ini dipanggil
startCampaignMonitor();

// File: db-handler.js (Diperbarui)
const fs = require("fs").promises;
const path = require("path");
const dbFilePath = path.join(__dirname, "database.json");
let writeQueue = Promise.resolve();

async function readDatabase() {
  await writeQueue;
  try {
    const data = await fs.readFile(dbFilePath, "utf8");
    const db = JSON.parse(data);
    // JARING PENGAMAN
    if (!db.items) db.items = [];
    if (!db.dataUser) db.dataUser = {};
    if (!db.dataCampaigns) db.dataCampaigns = {};
    if (!db.botSettings) db.botSettings = {}; // <-- TAMBAHKAN INI
    return db;
  } catch (err) {
    if (err.code === "ENOENT") {
      return { items: [], dataUser: {}, dataCampaigns: {}, botSettings: {} }; // <-- TAMBAHKAN INI
    }
    console.error("Gagal membaca/parse database:", err.message);
    return { items: [], dataUser: {}, dataCampaigns: {}, botSettings: {} }; // <-- TAMBAHKAN INI
  }
}

async function writeDatabase(data) {
  writeQueue = writeQueue
    .then(async () => {
      try {
        await fs.writeFile(dbFilePath, JSON.stringify(data, null, 4));
      } catch (err) {
        console.error("Gagal menulis ke database:", err);
      }
    })
    .catch((err) => {
      console.error("Error di antrian write DB:", err);
    });
  return writeQueue;
}

module.exports = { readDatabase, writeDatabase };

#!/usr/bin/env node
// WhatsApp ↔ file bridge. Run "node bridge.js" and forget about it.
// It writes incoming messages to ~/Desktop/OMBox/inbox/ as JSON files
// and polls ~/Desktop/OMBox/outbox/ for reply files to send back.

import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import { writeFileSync, readFileSync, unlinkSync, readdirSync, mkdirSync, appendFileSync } from "fs";
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { homedir } from "os";

const OMBOX = join(homedir(), "Desktop", "OMBox");
const INBOX = join(OMBOX, "inbox");
const OUTBOX = join(OMBOX, "outbox");

// Ensure directories exist
for (const d of [OMBOX, INBOX, OUTBOX, join(OMBOX, "public")]) mkdirSync(d, { recursive: true });

function digits(s) { return s.replace(/\D/g, ""); }

function logChat(sender, who, text) {
  const dir = join(OMBOX, digits(sender));
  mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
  const safe = text.replace(/[\r\n]+/g, " ↵ ");
  appendFileSync(join(dir, "chat.log"), `[${ts}] ${who}: ${safe}\n`);
}

let sock = null;
const jidMap = {};  // sender digits → full remoteJid

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  sock = makeWASocket({
    auth: state,
    syncFullHistory: false,
    logger: { info() {}, debug() {}, warn() {}, error: console.error, trace() {}, child() { return this; }, level: "error" }
  });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\nScan this QR code with WhatsApp:\n");
      console.log(await QRCode.toString(qr, { type: "terminal", small: true }));
    }
    if (connection === "open") {
      console.log("Connected to WhatsApp!");
      pollOutbox();
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log("Logged out. Delete ./auth and restart to re-pair.");
        process.exit(1);
      }
      console.log("Disconnected. Reconnecting in 5s...");
      setTimeout(start, 5000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      // Allow self-messages for testing (skip other fromMe like delivery receipts)
      if (msg.key.fromMe && !msg.message?.conversation && !msg.message?.extendedTextMessage?.text) continue;
      const text = msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || "";
      if (!text) continue;

      console.log("raw JID:", msg.key.remoteJid);
      const sender = digits(msg.key.remoteJid);
      jidMap[sender] = msg.key.remoteJid;
      console.log(`← ${sender}: ${text}`);

      // React with 🧠 if message starts with "om" — the open mind is thinking
      if (text.slice(0, 2).toLowerCase() === "om") {
        try {
          await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🧠", key: msg.key }
          });
        } catch {}
      }

      // Log and write to inbox
      logChat(sender, "them", text);
      const ts = Date.now();
      const filename = `${sender}_${ts}.json`;
      writeFileSync(join(INBOX, filename), JSON.stringify({ sender, text, ts }));
    }
  });
}

// Poll outbox/ every 2 seconds for reply files and reaction files
function pollOutbox() {
  setInterval(async () => {
    let files;
    try { files = readdirSync(OUTBOX); }
    catch { return; }

    for (const file of files.filter(f => f.endsWith(".txt"))) {
      try {
        const sender = file.replace(".txt", "");
        const reply = readFileSync(join(OUTBOX, file), "utf-8").trim();
        unlinkSync(join(OUTBOX, file));

        if (!reply) continue;

        const jid = jidMap[sender] || `${sender}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: reply });
        console.log(`→ ${sender}: ${reply}`);
        logChat(sender, "me", reply);
      } catch (e) {
        console.error("outbox error:", e.message);
      }
    }
  }, 2000);
}

start();

# om-bridge

A WhatsApp bridge for the [Open Mind](https://iamtrask.github.io/2026/04/07/decentralized-ai-in-50-lines/) — a peer-to-peer AI that answers your friends' messages using local data, with per-person privacy.

## Quick Start

```
npx @iamtrask/om-bridge
```

Scan the QR code with WhatsApp (Settings → Linked Devices → Link a Device). That's it.

## How It Works

The bridge saves incoming WhatsApp messages as JSON files in `~/Desktop/OMBox/inbox/` and polls `~/Desktop/OMBox/outbox/` for reply files to send back. Two programs talking through files.

A Python AI (running locally via [Ollama](https://ollama.com)) reads the inbox, generates a reply using per-person context folders, and writes it to the outbox. The bridge picks it up and sends it back through WhatsApp.

Messages must start with "om" to be processed — everything else is ignored.

## Manual Setup

If you prefer not to use npx:

```
git clone https://github.com/iamtrask/om-bridge.git
cd om-bridge
npm install
node bridge.js
```

## Learn More

- **Blog post:** [Decentralized AI in 50 Lines of Python](https://iamtrask.github.io/2026/04/07/decentralized-ai-in-50-lines/)
- **Video walkthrough:** [YouTube](https://www.youtube.com/watch?v=zY2dAK-pMPI)
- **Full course:** [Decentralized AI from Scratch](https://github.com/iamtrask/decentralized-ai-from-scratch)

## License

Apache 2.0 — see [LICENSE](LICENSE).

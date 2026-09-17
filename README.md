# Simple QR Code Generator

A tiny React + Vite app: type any text or URL, click **Generate**, get a QR code.

- Live site: see [LIVE-SITE.md](./LIVE-SITE.md)
- How the code and deployment work, explained line by line: see [HOW-IT-WORKS.md](./HOW-IT-WORKS.md)

## Run it locally

1. Clone this repo
   ```
   git clone https://github.com/Sawla-1/simple-qr-code-generator.git
   cd simple-qr-code-generator
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the dev server
   ```
   npm run dev
   ```
   Open the URL it prints (usually `http://localhost:5173`).

4. (Optional) Build for production
   ```
   npm run build
   ```
   This creates a `dist` folder — the same thing GitHub Actions builds and deploys automatically.

## Tech used

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [qrcode.react](https://www.npmjs.com/package/qrcode.react)

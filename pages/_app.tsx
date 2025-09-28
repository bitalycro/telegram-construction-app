import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <title>Строй Мини-апп</title>
      </Head>
      <div className="min-h-screen">
        <Component {...pageProps} />
      </div>
    </>
  );
}

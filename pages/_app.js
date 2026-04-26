import Head from "next/head";
import { useRouter } from "next/router";

import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  ClerkLoaded,
} from "@clerk/nextjs";

import Layout from "../components/Layout";

import "../styles/normalize.css";
import "../styles/styles.css";
import "../styles/admin.css";

const publicPages = [
  "/",
  "/sign-in/[[...index]]",
  "/sign-up/[[...index]]",
  "/404",
];

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Admin pages use their own layout (AdminLayout) — skip the site Layout wrapper
  const isAdminPage = router.pathname.startsWith("/admin");

  return (
    <ClerkProvider {...pageProps}>
      <Head>
        <meta name="description" content="The Coding Camp — A free online mini coding bootcamp" />
        <meta name="keywords" content="coding, bootcamp, web development, javascript, react" />
        <meta name="theme-color" content="#ec3944" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta property="og:title" content="The Coding Camp" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://minicodecamp.vercel.app/" />
        <meta property="og:description" content="The Coding Camp — Learn to code for free." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content="https://minicodecamp.vercel.app/cover.png"
        />
        <meta name="twitter:title" content="The Coding Camp" />
        <meta name="twitter:description" content="The Coding Camp — Learn to code for free." />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <title>The Coding Camp</title>
      </Head>

      {/* Admin pages: protected by cookie middleware, use their own AdminLayout — no Clerk needed */}
      {isAdminPage ? (
        <Component {...pageProps} />
      ) : publicPages.includes(router.pathname) ? (
        <ClerkLoaded>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ClerkLoaded>
      ) : (
        <>
          <SignedIn>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </SignedIn>
          <SignedOut>
            <Layout>
              <RedirectToSignIn />
            </Layout>
          </SignedOut>
        </>
      )}
    </ClerkProvider>
  );
}

export default MyApp;

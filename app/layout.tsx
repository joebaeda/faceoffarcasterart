import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./providers/Provider";
import { Suspense } from "react";
import FaceOfFarcasterArt from "./components/FaceOfFarcasterArt";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = "https://faceoffarcasterart.vercel.app";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const ogImageUrl = `${appUrl}/og-image.jpg`;

  return {
    title: "FAFA | Face of Farcaster Art",
    description: "A platform exclusively for Farcaster users to mint their PFP into Digital Art!",
    openGraph: {
      title: "FAFA | Face of Farcaster Art",
      description: "A platform exclusively for Farcaster users to mint their PFP into Digital Art!",
      url: appUrl,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 600,
          alt: 'Mint your Face of Farcaster Art!',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: "FAFA | Face of Farcaster Art",
      description: "A platform exclusively for Farcaster users to mint their PFP into Digital Art!",
      images: [ogImageUrl],
    },
    icons: {
      icon: '/favicon.ico',
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: ogImageUrl,
        button: {
          title: "Mint your FAFA",
          action: {
            type: "launch_frame",
            name: "FAFA",
            url: appUrl,
            splashImageUrl: `${appUrl}/splash.png`,
            splashBackgroundColor: "#1b1423",
          },
        },
      }),
    },
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} antialiased bg-[#1b1423]`}
      >
        <Suspense fallback={<FaceOfFarcasterArt />}>
          <Provider>
            {children}
          </Provider>
        </Suspense>
      </body>
    </html>
  );
}

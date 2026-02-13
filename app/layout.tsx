import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Pleasure",
  description: "台灣首款亲密關係健康追蹤 Web App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${inter.className} relative max-w-[480px] mx-auto min-h-screen shadow-2xl bg-black overflow-x-hidden`}
        style={{ transform: "translateZ(0)" }}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}

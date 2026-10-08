import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/auth/auth-provider";
import { MczAssistant } from "./components/mcz-assistant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCZ onTV | Seu entretenimento começa aqui.",
  description: "Oferta exclusiva para novos clientes: R$15,00/mês durante os 6 primeiros meses. Após esse período, R$25,00/mês. Conheça os planos MCZ onTV.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><AuthProvider>{children}<MczAssistant /></AuthProvider></body>
    </html>
  );
}

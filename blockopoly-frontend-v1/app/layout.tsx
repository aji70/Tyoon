import { dmSans, kronaOne, orbitron } from "@/components/shared/fonts";
import NavBar from "@/components/shared/navbar";
import ScrollToTopBtn from "@/components/shared/scroll-to-top-btn";
import "@/styles/globals.css";
import { getMetadata } from "@/utils/getMeatadata";
import { headers } from 'next/headers';
import ContextProvider from '@/context';
import AppKitProviderWrapper from '@/components/AppKitProviderWrapper'; // Import the new wrapper
import { PlayerContractProvider } from "@/context/ContractProvider";

export const metadata = getMetadata({
  title: "Blockopoly",
  description:
    "Blockopoly is a decentralized on-chain game inspired by the classic Monopoly game, built on Base. It allows players to buy, sell, and trade digital properties in a trustless gaming environment.",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${orbitron.variable} ${dmSans.variable} ${kronaOne.variable}`}
    >
      <body className="antialiased bg-[#010F10] w-full">
        <ContextProvider cookies={cookies}>
          <PlayerContractProvider>
            <AppKitProviderWrapper>
              <NavBar />
              {children}
              <ScrollToTopBtn />
            </AppKitProviderWrapper>
          </PlayerContractProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
// components/ConnectWallet.tsx
"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ConnectWallet() {
  return (
    <div style={{ padding: "1rem" }}>
      <ConnectButton showBalance={false} />
    </div>
  );
}

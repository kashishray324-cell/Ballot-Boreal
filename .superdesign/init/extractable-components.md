# Extractable components

## CivicHeader

- Source: `src/App.tsx`
- Category: layout
- Description: Product mark, anchor navigation, and network state.
- Extractable props: `network`, `walletState`.

## DisclosureBoundary

- Source: `src/App.tsx`
- Category: basic
- Description: Device-private versus published-to-Midnight explanation panel.
- Extractable props: `privateItems`, `publicItems`.

## WalletSessionCard

- Source: `src/App.tsx`
- Category: basic
- Description: 1AM-preferred provider selection and Preview/Preprod state.
- Extractable props: `network`, `connected`, `providerName`.

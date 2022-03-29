import { IWalletConnectExtensionAdapter } from "@web3auth/base";
import bowser, { OS_MAP, PLATFORMS_MAP } from "bowser";
import { memo, useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";

import Image from "./Image";

const walletConnectIcon = <Image imageId="wallet-connect" width="114px" />;

interface WalletConnectProps {
  walletConnectUri: string;
  wcAdapters: IWalletConnectExtensionAdapter[];
}

interface IMobileRegistryEntry {
  name: string;
  logo: string;
  universalLink: string;
  deepLink: string;
  href: string;
}
type platform = "mobile" | "desktop";

type os = "iOS" | "Android";

function formatIOSMobile(params: { uri: string; universalLink?: string; deepLink?: string }) {
  const encodedUri: string = encodeURIComponent(params.uri);
  if (params.universalLink) {
    return `${params.universalLink}/wc?uri=${encodedUri}`;
  }
  if (params.deepLink) {
    return `${params.deepLink}${params.deepLink.endsWith(":") ? "//" : "/"}wc?uri=${encodedUri}`;
  }
  return "";
}

function formatMobileRegistryEntry(
  entry: IWalletConnectExtensionAdapter,
  walletConnectUri: string,
  os: os,
  platform: "mobile" | "desktop" = "mobile"
): IMobileRegistryEntry {
  const universalLink = entry[platform].universal || "";
  const deepLink = entry[platform].native || "";
  return {
    name: entry.name || "",
    logo: entry.logo || "",
    universalLink,
    deepLink,
    href: os === OS_MAP.iOS ? formatIOSMobile({ uri: walletConnectUri, universalLink, deepLink }) : walletConnectUri,
  };
}

function formatMobileRegistry(
  registry: IWalletConnectExtensionAdapter[],
  walletConnectUri: string,
  os: os,
  platform: platform = "mobile"
): IMobileRegistryEntry[] {
  return Object.values<IWalletConnectExtensionAdapter>(registry)
    .filter((entry) => !!entry[platform].universal || !!entry[platform].native)
    .map((entry) => formatMobileRegistryEntry(entry, walletConnectUri, os, platform));
}

function WalletConnect(props: WalletConnectProps) {
  const { walletConnectUri, wcAdapters } = props;
  const [links, setLinks] = useState<IMobileRegistryEntry[]>([]);

  const deviceDetails = useMemo<{ platform: platform; os: os }>(() => {
    const browser = bowser.getParser(window.navigator.userAgent);
    return { platform: browser.getPlatformType() as platform, os: browser.getOSName() as os };
  }, []);

  useEffect(() => {
    if (deviceDetails.platform === PLATFORMS_MAP.mobile) {
      const mobileLinks = formatMobileRegistry(wcAdapters, walletConnectUri, deviceDetails.os, deviceDetails.platform);
      setLinks(mobileLinks);
    }
  }, [wcAdapters, deviceDetails.os, deviceDetails.platform, walletConnectUri]);

  // TODO: show only wcAdapters of current chain
  return (
    <div className="w3ajs-wallet-connect w3a-wallet-connect">
      <i className="w3a-wallet-connect__logo">{walletConnectIcon}</i>
      <div className="w3ajs-wallet-connect__container w3a-wallet-connect__container">
        {deviceDetails.platform === PLATFORMS_MAP.desktop ? (
          <>
            <div>Scan QR code with a WalletConnect-compatible wallet</div>
            <div className="w3ajs-wallet-connect-qr w3a-wallet-connect-qr">
              <QRCode size={200} value={walletConnectUri} />
            </div>
          </>
        ) : (
          <>
            {links.map((link) => {
              // TODO: render logo and on click,
              // https://github.com/WalletConnect/walletconnect-monorepo/blob/54f3ca0b1cd1ac24e8992a5a812fdfad01769abb/packages/helpers/browser-utils/src/registry.ts#L24
              // format and show
              return deviceDetails.os === OS_MAP.iOS ? (
                <a key={link.name} href={link.href} rel="noopener noreferrer" target="_blank">
                  <button type="button" className="w3a-button w3a-button--icon">
                    {link.logo}
                  </button>
                  <p className="w3a-adapter-item__label">{link.name}</p>
                </a>
              ) : (
                <a key={link.name} href={link.href} rel="noopener noreferrer" target="_blank">
                  <button type="button" className="w3a-button w3a-button--icon">
                    Connect
                  </button>
                </a>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default memo(WalletConnect);

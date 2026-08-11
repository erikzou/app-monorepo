import { useCallback } from 'react';

import { IconButton, XStack } from '@onekeyhq/components';
import { openExplorerAddressUrl } from '@onekeyhq/kit/src/utils/explorerUtils';
import { openUrlExternal } from '@onekeyhq/shared/src/utils/openUrlUtils';
import type { IMarketStockInstrument } from '@onekeyhq/shared/types/marketV2';

import { MarketTestIDs } from '../../../testIDs';
import { useTokenDetail } from '../../hooks/useTokenDetail';

/**
 * Links that belong to the selected token rather than to the stock: they used
 * to sit in the page header, which on an entity page would wrongly imply they
 * describe the company.
 */
export function TokenLinkRow({
  instrument,
}: {
  instrument: IMarketStockInstrument;
}) {
  const { tokenDetail } = useTokenDetail();
  const website = tokenDetail?.extraData?.website;
  const twitter = tokenDetail?.extraData?.twitter;

  const handleOpenExplorer = useCallback(() => {
    void openExplorerAddressUrl({
      networkId: instrument.networkId,
      address: instrument.contractAddress,
      openInExternal: true,
    });
  }, [instrument.contractAddress, instrument.networkId]);

  const handleOpenWebsite = useCallback(() => {
    if (website) {
      openUrlExternal(website);
    }
  }, [website]);

  const handleOpenTwitter = useCallback(() => {
    if (twitter) {
      openUrlExternal(twitter);
    }
  }, [twitter]);

  // Audit keeps its label because the finding count only reads with one;
  // the rest are recognizable enough as icons and stay compact.
  const links = [
    website
      ? {
          key: 'website',
          icon: 'GlobusOutline' as const,
          label: 'Website',
          onPress: handleOpenWebsite,
        }
      : undefined,
    twitter
      ? {
          key: 'twitter',
          icon: 'Xbrand' as const,
          label: 'Twitter',
          onPress: handleOpenTwitter,
        }
      : undefined,
    instrument.contractAddress
      ? {
          key: 'explorer',
          icon: 'OpenOutline' as const,
          label: 'Explorer',
          onPress: handleOpenExplorer,
        }
      : undefined,
  ].filter(Boolean) as {
    key: string;
    icon: 'OpenOutline' | 'GlobusOutline' | 'Xbrand';
    label: string;
    onPress: () => void;
  }[];

  return (
    // Design keeps only the link buttons here, right-aligned.
    <XStack flexWrap="wrap" gap="$2" pt="$1" justifyContent="flex-end">
      {links.map((link) => (
        <IconButton
          key={link.key}
          testID={MarketTestIDs.stockTokenLink(link.key)}
          size="small"
          variant="secondary"
          icon={link.icon}
          // IconButton's small default is $5; Button's small icon is $4.5.
          // These sit next to the Audit button, so follow the Button scale.
          iconSize="$4.5"
          borderRadius="$full"
          title={link.label}
          onPress={link.onPress}
        />
      ))}
    </XStack>
  );
}

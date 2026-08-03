import { useCallback } from 'react';

import { useIntl } from 'react-intl';

import {
  Button,
  Dialog,
  Icon,
  IconButton,
  SizableText,
  XStack,
} from '@onekeyhq/components';
import { openExplorerAddressUrl } from '@onekeyhq/kit/src/utils/explorerUtils';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import { openUrlExternal } from '@onekeyhq/shared/src/utils/openUrlUtils';
import type { IMarketStockInstrument } from '@onekeyhq/shared/types/marketV2';

import { MarketTestIDs } from '../../../testIDs';
import { useTokenDetail } from '../../hooks/useTokenDetail';
import { TokenSecurityAlertDialogContent } from '../TokenSecurityAlert/components';
import { useTokenSecurity } from '../TokenSecurityAlert/hooks';
import { getTotalSecurityDisplayInfo } from '../TokenSecurityAlert/utils/utils';

function AuditButton() {
  const intl = useIntl();
  const { tokenAddress, networkId } = useTokenDetail();
  const { securityData, securityStatus, riskCount, cautionCount } =
    useTokenSecurity({ tokenAddress, networkId });

  const handlePress = useCallback(() => {
    Dialog.show({
      title: intl.formatMessage({ id: ETranslations.dexmarket_audit }),
      showFooter: false,
      renderContent: (
        <TokenSecurityAlertDialogContent
          securityData={securityData}
          riskCount={riskCount}
          cautionCount={cautionCount}
        />
      ),
    });
  }, [cautionCount, intl, riskCount, securityData]);

  if (!securityData) {
    return null;
  }

  const { count, color } = getTotalSecurityDisplayInfo(
    securityStatus,
    riskCount,
    cautionCount,
  );

  return (
    <Button
      testID={MarketTestIDs.stockAuditButton}
      size="small"
      variant="secondary"
      borderRadius="$full"
      onPress={handlePress}
    >
      <XStack alignItems="center" gap="$1.5">
        <Icon name="BugOutline" size="$4.5" color={color} />
        <SizableText size="$bodyMdMedium" color="$text">
          Audit
        </SizableText>
        <SizableText size="$bodyMdMedium" color={color}>
          {count}
        </SizableText>
      </XStack>
    </Button>
  );
}

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
    <XStack flexWrap="wrap" gap="$2" pt="$1">
      <AuditButton />
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

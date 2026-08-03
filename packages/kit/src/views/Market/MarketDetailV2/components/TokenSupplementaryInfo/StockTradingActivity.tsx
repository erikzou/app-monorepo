import { Divider, YStack } from '@onekeyhq/components';

import { useMarketStockEntity } from '../../hooks/useMarketStockEntity';
import { useStockSecurityStats } from '../../hooks/useStockSecurityStats';
import { useTokenDetail } from '../../hooks/useTokenDetail';
import { StockDescriptionRows } from '../StockDescriptionRows';
import { StockStatSections } from '../StockStatSections';

export function StockTradingActivity() {
  const { tokenDetail } = useTokenDetail();
  const { entity } = useMarketStockEntity();
  // Prefer the stock index: the token detail only carries `stock` for Ondo
  // variants, so xStock variants would otherwise render an empty panel.
  const stock = entity?.stock ?? tokenDetail?.stock;
  const { assetAnalysisRows, tradingActivityRows, descriptionRows } =
    useStockSecurityStats(stock);

  if (!stock) {
    return null;
  }

  return (
    <YStack px="$3" pt="$3" gap="$3">
      <StockDescriptionRows rows={descriptionRows} />

      <Divider my="$1" />

      <StockStatSections
        assetAnalysisRows={assetAnalysisRows}
        tradingActivityRows={tradingActivityRows}
      />
    </YStack>
  );
}

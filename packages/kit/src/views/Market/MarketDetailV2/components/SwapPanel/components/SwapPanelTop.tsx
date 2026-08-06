import { useIntl } from 'react-intl';

import { Divider, SizableText, XStack, YStack } from '@onekeyhq/components';
import type { IAccountSelectorActiveAccountInfo } from '@onekeyhq/kit/src/states/jotai/contexts/accountSelector';
import { ETranslations } from '@onekeyhq/shared/src/locale';

import { BalanceDisplay } from './BalanceDisplay';

import type { ISwapPanelVariant, IToken } from '../types';
import type BigNumber from 'bignumber.js';

interface ISwapPanelTopProps {
  balance?: BigNumber;
  enableAddressTypeSelector: boolean;
  activeAccount: IAccountSelectorActiveAccountInfo;
  balanceToken?: IToken;
  balanceLoading: boolean;
  handleBalanceClick: () => void;
  panelVariant?: ISwapPanelVariant;
}

const SwapPanelTop = ({
  balance,
  enableAddressTypeSelector = false,
  balanceToken,
  balanceLoading,
  activeAccount,
  handleBalanceClick,
  panelVariant = 'default',
}: ISwapPanelTopProps) => {
  const intl = useIntl();
  const isStockDesktop = panelVariant === 'stockDesktop';

  const balanceDisplay = (
    <BalanceDisplay
      activeAccount={activeAccount}
      balance={balance}
      enableAddressTypeSelector={enableAddressTypeSelector}
      token={balanceToken}
      isLoading={balanceLoading}
      onBalanceClick={handleBalanceClick}
      useIcon
    />
  );

  // Stock detail design (Figma 25206:18426): a 32px tab row with 2px side
  // padding and no rule — neither the active underline nor the divider.
  if (isStockDesktop) {
    return (
      <XStack px="$0.5" alignItems="center" justifyContent="space-between">
        <XStack h="$8" alignItems="center" justifyContent="center">
          <SizableText size="$bodyMdMedium" color="$text" cursor="default">
            {intl.formatMessage({ id: ETranslations.perp_trade_market })}
          </SizableText>
        </XStack>
        {balanceDisplay}
      </XStack>
    );
  }

  return (
    <YStack>
      <XStack justifyContent="space-between">
        <XStack
          borderBottomWidth="$0.5"
          borderBottomColor="$borderActive"
          ml={2}
        >
          <SizableText size="$bodyMdMedium" cursor="default">
            {intl.formatMessage({ id: ETranslations.perp_trade_market })}
          </SizableText>
        </XStack>
        {balanceDisplay}
      </XStack>
      <Divider />
    </YStack>
  );
};

export default SwapPanelTop;

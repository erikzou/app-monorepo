import { useCallback } from 'react';

import { SizableText, XStack } from '@onekeyhq/components';

import { STOCK_DETAIL_LAYOUT } from './constants';

export interface IStockDetailTabItem {
  id: string;
  label: string;
}

function TabItem({
  id,
  label,
  isActive,
  onPress,
}: IStockDetailTabItem & {
  isActive: boolean;
  onPress: (id: string) => void;
}) {
  const handlePress = useCallback(() => onPress(id), [id, onPress]);

  return (
    <XStack
      h={STOCK_DETAIL_LAYOUT.tabsHeight}
      pb="$0.5"
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      userSelect="none"
      borderBottomWidth={2}
      borderBottomColor={isActive ? '$borderActive' : '$transparent'}
      onPress={handlePress}
    >
      <SizableText
        size="$bodyMdMedium"
        color={isActive ? '$text' : '$textSubdued'}
      >
        {label}
      </SizableText>
    </XStack>
  );
}

/**
 * Underlined tab row above the stock detail sections (Figma 25233:40821).
 */
export function StockDetailTabs({
  items,
  value,
  onChange,
}: {
  items: IStockDetailTabItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <XStack px="$5" gap="$5" alignItems="center">
      {items.map((item) => (
        <TabItem
          key={item.id}
          id={item.id}
          label={item.label}
          isActive={item.id === value}
          onPress={onChange}
        />
      ))}
    </XStack>
  );
}

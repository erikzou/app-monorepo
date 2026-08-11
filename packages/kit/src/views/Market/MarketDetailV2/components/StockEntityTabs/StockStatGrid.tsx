import {
  Popover,
  SizableText,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';

export interface IStockStatItem {
  key: string;
  label: string;
  value: string;
  tooltip?: string;
}

const COLUMNS = 4;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/**
 * Flat label-over-value grid used by the stock entity page's main column.
 * Distinct from `StatCard`, which is the filled variant the narrow right
 * column uses.
 */
export function StockStatGrid({ items }: { items: IStockStatItem[] }) {
  if (items.length === 0) {
    return null;
  }

  const rows = chunk(items, COLUMNS);

  return (
    // Row rhythm and type scale follow Figma 25334:9345: 24px between rows,
    // 6px between a label and its value, 14px label over an 18px value.
    <YStack gap="$6">
      {rows.map((row, rowIndex) => (
        // eslint-disable-next-line react/no-array-index-key
        <XStack key={rowIndex}>
          {row.map((item) => (
            <YStack
              key={item.key}
              gap="$1.5"
              pr="$2.5"
              flexGrow={1}
              flexShrink={1}
              flexBasis={0}
              minWidth={0}
            >
              <XStack alignItems="center" gap="$1">
                <SizableText size="$bodyMd" color="$textSubdued">
                  {item.label}
                </SizableText>
                {item.tooltip ? (
                  <Popover.Tooltip
                    iconSize="$4"
                    title={item.label}
                    tooltip={item.tooltip}
                    placement="top"
                  />
                ) : null}
              </XStack>
              <SizableText size="$headingLg" color="$text">
                {item.value}
              </SizableText>
            </YStack>
          ))}
          {/* Keep the last row's columns aligned with the rows above it. */}
          {row.length < COLUMNS
            ? Array.from({ length: COLUMNS - row.length }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Stack key={`spacer-${index}`} flexGrow={1} flexBasis={0} />
              ))
            : null}
        </XStack>
      ))}
    </YStack>
  );
}

export function StockStatSection({
  title,
  items,
}: {
  title: string;
  items: IStockStatItem[];
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <YStack gap="$4">
      <SizableText size="$headingMd" color="$text">
        {title}
      </SizableText>
      <StockStatGrid items={items} />
    </YStack>
  );
}

import {
  Icon,
  NumberSizeableText,
  SizableText,
  Stack,
  XStack,
} from '@onekeyhq/components';
import type { IKeyOfIcons } from '@onekeyhq/components';
import { LazyTooltip } from '@onekeyhq/components/src/actions/LazyTooltip';

type IHoldingsBreakdownRow = {
  key: string;
  icon: IKeyOfIcons;
  label: string;
  value: string;
};

/**
 * MOCK DATA — holder concentration has no wired source yet, so the popover
 * renders the design's figures (Figma 25375:49590) to lock the layout down.
 * The same four metrics back the "Holdings audit" group in the Filters dialog,
 * which is disabled for the same reason. Replace with the distribution payload.
 *
 * The design's Insider row uses a bespoke rodent glyph that is not in the icon
 * set; `AnonymousHiddenOutline` stands in for it.
 */
const MOCK_HOLDINGS_BREAKDOWN: IHoldingsBreakdownRow[] = [
  { key: 'top10', icon: 'PeopleOutline', label: 'Top 10', value: '13.33%' },
  { key: 'dev', icon: 'CodeBracketsOutline', label: 'Dev', value: '<0.01%' },
  {
    key: 'bundlers',
    icon: 'Layers3Outline',
    label: 'Bundlers',
    value: '0.34%',
  },
  {
    key: 'insider',
    icon: 'AnonymousHiddenOutline',
    label: 'Insider',
    value: '--',
  },
];

const POPOVER_WIDTH = 144;

const POPOVER_CONTENT_PROPS = {
  width: POPOVER_WIDTH,
  p: '$3',
  borderRadius: '$3',
} as const;

function HoldingsBreakdown() {
  return (
    <Stack gap="$3" width="100%">
      {MOCK_HOLDINGS_BREAKDOWN.map((row) => (
        <XStack key={row.key} gap="$1" alignItems="center">
          <Icon name={row.icon} size="$4" color="$icon" />
          <SizableText size="$bodySm" color="$text" flex={1} minWidth={0}>
            {row.label}
          </SizableText>
          <SizableText size="$bodySmMedium" color="$text" textAlign="right">
            {row.value}
          </SizableText>
        </XStack>
      ))}
    </Stack>
  );
}

/**
 * Holder count, with the concentration breakdown on hover. The breakdown hangs
 * off Holders rather than off any other cell because every row in it is a share
 * of the holder base.
 */
export function TrendingHoldersCell({ holders }: { holders: number }) {
  return (
    <LazyTooltip
      hovering
      placement="top"
      contentProps={POPOVER_CONTENT_PROPS}
      renderContent={<HoldingsBreakdown />}
      renderTrigger={
        // The trigger has to be a View: text primitives drop `onHoverIn`, and
        // LazyTooltip needs that first hover to pull the tooltip chunk in.
        <Stack>
          <NumberSizeableText size="$bodyMdMedium" formatter="marketCap">
            {holders === 0 ? '--' : holders}
          </NumberSizeableText>
        </Stack>
      }
    />
  );
}

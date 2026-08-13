import { Icon, SizableText, XStack } from '@onekeyhq/components';

export type IMarketTrendingRiskLevel = 'low' | 'medium' | 'unrated';

/**
 * DEMO DATA — the token risk rating has no wired source yet. The level is
 * derived from the token address so a row keeps the same badge across
 * re-renders, websocket price updates and re-sorts; it says nothing about the
 * actual token. Replace `getDemoRiskLevel` with the rating field.
 *
 * Only the three levels the design specifies are implemented (Figma
 * 25375:49667 / 25375:49141 / 25375:49057) — a "high" state has no design yet.
 */
export function getDemoRiskLevel(seed: string): IMarketTrendingRiskLevel {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  // Roughly 2 in 10 medium and 1 in 10 unrated, so one screen shows all three
  // states rather than depending on what the pool happens to contain.
  const bucket = hash % 10;
  if (bucket < 2) {
    return 'medium';
  }
  if (bucket === 2) {
    return 'unrated';
  }
  return 'low';
}

const RISK_BADGE_MIN_WIDTH = 27;
const RISK_ICON_SIZE = '$3';

// TODO(i18n): demo copy, hardcoded English.
const RISK_LABELS: Record<IMarketTrendingRiskLevel, string> = {
  low: 'Low',
  medium: 'Med',
  unrated: 'Unrated',
};

export function TrendingRiskBadge({
  level,
}: {
  level: IMarketTrendingRiskLevel;
}) {
  const isCaution = level === 'medium';
  return (
    <XStack
      minWidth={RISK_BADGE_MIN_WIDTH}
      px="$1.5"
      py="$0.5"
      gap="$1"
      borderRadius="$1"
      borderCurve="continuous"
      alignItems="center"
      justifyContent="center"
      bg={isCaution ? '$bgCaution' : '$bgHover'}
    >
      {isCaution ? (
        <Icon name="ErrorOutline" size={RISK_ICON_SIZE} color="$iconCaution" />
      ) : null}
      <SizableText
        size="$bodyXs"
        color={isCaution ? '$textCaution' : '$textSubdued'}
        textAlign="center"
      >
        {RISK_LABELS[level]}
      </SizableText>
    </XStack>
  );
}

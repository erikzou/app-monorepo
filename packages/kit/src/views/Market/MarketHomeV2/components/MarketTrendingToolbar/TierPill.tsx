import { SizableText, XStack } from '@onekeyhq/components';

/**
 * Tier pill used by the Filters dialog.
 * - `filled` (default): a bg-strong capsule; selected swaps to bg-active with
 *   an active border ring.
 * - `plain`: transparent until selected (time-frame segment style), where the
 *   selected option takes the bg-strong fill instead.
 */
export function TierPill({
  label,
  selected,
  disabled,
  grow,
  minWidth = 72,
  variant = 'filled',
  onPress,
  testID,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  /** Stretch to share the row width evenly (tier grid layout). */
  grow?: boolean;
  minWidth?: number;
  variant?: 'filled' | 'plain';
  onPress?: () => void;
  testID: string;
}) {
  const isPlain = variant === 'plain';
  let backgroundColor = '$bgStrong';
  if (isPlain) {
    backgroundColor = selected ? '$bgStrong' : '$transparent';
  } else if (selected) {
    backgroundColor = '$bgActive';
  }
  let textColor = '$text';
  if (disabled) {
    textColor = '$textDisabled';
  } else if (isPlain && !selected) {
    textColor = '$textSubdued';
  }

  return (
    <XStack
      {...(grow ? { flexGrow: 1, flexBasis: 0, minWidth } : null)}
      alignItems="center"
      justifyContent="center"
      px={isPlain ? '$1.5' : '$2.5'}
      py="$1"
      borderRadius="$full"
      borderWidth={1}
      borderColor={selected && !isPlain ? '$borderActive' : '$transparent'}
      bg={backgroundColor}
      opacity={disabled ? 0.5 : 1}
      {...(!disabled && {
        hoverStyle: {
          bg: isPlain && !selected ? '$bgHover' : '$bgStrongHover',
        },
        pressStyle: { bg: '$bgStrongActive' },
        onPress,
        role: 'button' as const,
        cursor: 'pointer' as const,
      })}
      userSelect="none"
      testID={testID}
    >
      <SizableText size="$bodyMdMedium" color={textColor} numberOfLines={1}>
        {label}
      </SizableText>
    </XStack>
  );
}

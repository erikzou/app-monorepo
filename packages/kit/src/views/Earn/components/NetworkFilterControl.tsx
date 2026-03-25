import { useCallback, useMemo, useState } from 'react';

import {
  Button,
  Checkbox,
  Icon,
  Popover,
  SizableText,
  XStack,
  YStack,
} from '@onekeyhq/components';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { NetworkAvatar } from '@onekeyhq/kit/src/components/NetworkAvatar/NetworkAvatar';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';

interface INetworkFilterControlProps {
  availableNetworkIds: string[];
  selectedNetworkIds: string[];
  onSelectionChange: (networkIds: string[]) => void;
}

function NetworkFilterControl({
  availableNetworkIds,
  selectedNetworkIds,
  onSelectionChange,
}: INetworkFilterControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { result: networks } = usePromiseResult(async () => {
    if (availableNetworkIds.length === 0) return [];
    const resp = await backgroundApiProxy.serviceNetwork.getNetworksByIds({
      networkIds: availableNetworkIds,
    });
    return resp.networks;
  }, [availableNetworkIds]);

  const toggleNetwork = useCallback(
    (networkId: string) => {
      const isSelected = selectedNetworkIds.includes(networkId);
      if (isSelected) {
        onSelectionChange(selectedNetworkIds.filter((id) => id !== networkId));
      } else {
        onSelectionChange([...selectedNetworkIds, networkId]);
      }
    },
    [selectedNetworkIds, onSelectionChange],
  );

  const handleReset = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const hasActiveFilter = selectedNetworkIds.length > 0;

  const buttonLabel = useMemo(() => {
    if (selectedNetworkIds.length === 0) {
      return 'All Networks';
    }
    if (selectedNetworkIds.length === 1) {
      const network = networks?.find((n) => n.id === selectedNetworkIds[0]);
      return network?.name ?? 'All Networks';
    }
    return `${selectedNetworkIds.length} Networks`;
  }, [selectedNetworkIds, networks]);

  return (
    <Popover
      title="Networks"
      showHeader={false}
      open={isOpen}
      onOpenChange={setIsOpen}
      renderTrigger={
        <XStack ai="center" gap="$2" cursor="pointer">
          <SizableText
            size={hasActiveFilter ? '$bodyMdMedium' : '$bodyMd'}
            color={hasActiveFilter ? '$text' : '$textSubdued'}
          >
            {buttonLabel}
          </SizableText>
          <Icon
            name={isOpen ? 'ChevronTopSmallOutline' : 'ChevronDownSmallOutline'}
            size="$4.5"
            color="$iconSubdued"
          />
        </XStack>
      }
      floatingPanelProps={{
        maxWidth: 240,
      }}
      renderContent={
        <YStack px="$5" py="$4">
          <XStack jc="space-between" ai="center">
            <SizableText size="$bodyMd" color="$textSubdued">
              Networks
            </SizableText>
            {selectedNetworkIds.length > 0 ? (
              <Button variant="tertiary" size="small" onPress={handleReset}>
                Reset
              </Button>
            ) : null}
          </XStack>
          <YStack mt="$2.5">
            {networks?.map((network) => {
              const isSelected = selectedNetworkIds.includes(network.id);
              return (
                <XStack
                  key={network.id}
                  py="$2"
                  gap="$2"
                  ai="center"
                  onPress={() => toggleNetwork(network.id)}
                  cursor="pointer"
                >
                  <Checkbox
                    value={isSelected}
                    onChange={() => toggleNetwork(network.id)}
                    containerProps={{ py: '$0' }}
                    shouldStopPropagation
                  />
                  <NetworkAvatar networkId={network.id} size="$5" />
                  <SizableText size="$bodyLgMedium">{network.name}</SizableText>
                </XStack>
              );
            })}
          </YStack>
        </YStack>
      }
      placement="bottom-start"
    />
  );
}

export { NetworkFilterControl };

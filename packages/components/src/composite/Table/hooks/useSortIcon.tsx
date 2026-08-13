import { useCallback } from 'react';

import { Icon } from '../../../primitives';

import type { IIconProps } from '../../../primitives';
import type { ETableSortType } from '../types';

const DEFAULT_SORT_ICON_SIZE: IIconProps['size'] = '$4';

export interface IUseSortIconParams {
  showSortIcon?: boolean;
  order?: 'asc' | 'desc' | undefined;
  cursor?: string;
  disabledSorts?: ETableSortType[];
  size?: IIconProps['size'];
}

export function useSortIcon({
  showSortIcon,
  order,
  cursor,
  disabledSorts = [],
  size = DEFAULT_SORT_ICON_SIZE,
}: IUseSortIconParams) {
  const renderSortIcon = useCallback(() => {
    if (!showSortIcon) {
      return null;
    }

    // Check if only one sort type is available
    const availableSorts = (['asc', 'desc'] as ETableSortType[]).filter(
      (sort) => !disabledSorts.includes(sort),
    );

    const isSingleSortMode = availableSorts.length === 1;

    if (isSingleSortMode) {
      // Single sort mode: always show the available sort direction
      const singleSortType = availableSorts[0];
      const isActive = order === singleSortType;

      return (
        <Icon
          cursor={cursor}
          name={
            singleSortType === 'desc'
              ? 'ChevronDownSmallOutline'
              : 'ChevronTopSmallOutline'
          }
          color={isActive ? '$iconActive' : '$iconSubdued'}
          size={size}
        />
      );
    }

    // Multi-sort mode: use original logic
    if (order) {
      return (
        <Icon
          cursor={cursor}
          name={
            order === 'desc'
              ? 'ChevronDownSmallOutline'
              : 'ChevronTopSmallOutline'
          }
          color="$iconSubdued"
          size={size}
        />
      );
    }

    return (
      <Icon
        cursor={cursor}
        name="ChevronGrabberVerOutline"
        color="$iconSubdued"
        size={size}
      />
    );
  }, [cursor, order, showSortIcon, disabledSorts, size]);

  return { renderSortIcon };
}

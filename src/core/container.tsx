import React, { useMemo } from 'react';
import { useTheme } from '../theme/provider.js';
import { TransformPipeline } from '../transforms/pipeline.js';
import type { ChainableTransform, DataTransform, TransformedData } from '../transforms/types.js';

type AnyTransform = DataTransform<unknown> | ChainableTransform;

export interface WidgetContainerProps {
  /**
   * Raw data to pass through the transform pipeline.
   * Can be any shape — the first transform is responsible for normalizing it.
   */
  data: unknown;
  /**
   * Optional ordered list of transforms. Applied as a pipeline.
   * If omitted, data must already conform to TransformedData.
   */
  transforms?: AnyTransform[];
  /** Container width in pixels. Default: 100%. */
  width?: number | string;
  /** Container height in pixels. Default: 400. */
  height?: number | string;
  /** Optional title rendered above the content area. */
  title?: string;
  children: (transformedData: TransformedData) => React.ReactNode;
}

/**
 * WidgetContainer runs data through the transform pipeline and provides
 * the result to its children via a render prop.
 *
 * @example
 * <WidgetContainer data={rawRows} transforms={[flatten, groupBy('region')]}>
 *   {(data) => <ViewSwitcher views={['bar', 'table']} vizProps={{ data, width: 600, height: 400 }} />}
 * </WidgetContainer>
 */
export function WidgetContainer({
  data,
  transforms,
  width = '100%',
  height = 400,
  title,
  children,
}: WidgetContainerProps): React.ReactElement {
  const theme = useTheme();

  const transformedData = useMemo<TransformedData>(() => {
    if (!transforms || transforms.length === 0) {
      // Assume data is already TransformedData
      return data as TransformedData;
    }
    const pipeline = new TransformPipeline(transforms);
    return pipeline.run(data);
  }, [data, transforms]);

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        background: theme.surface.background,
        border: `1px solid ${theme.surface.border}`,
        borderRadius: theme.surface.borderRadius,
        boxShadow: theme.surface.shadowSm,
        overflow: 'hidden',
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSizeBase,
        color: theme.text.primary,
      }}
    >
      {title && (
        <div
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderBottom: `1px solid ${theme.surface.border}`,
            fontWeight: theme.typography.fontWeightBold,
            fontSize: theme.typography.fontSizeLg,
            color: theme.text.primary,
            flexShrink: 0,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children(transformedData)}
      </div>
    </div>
  );
}

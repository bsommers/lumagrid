export { WidgetContainer } from './container.js';
export type { WidgetContainerProps } from './container.js';

export { ViewSwitcher } from './view-switcher.js';
export type { ViewSwitcherProps } from './view-switcher.js';

export { CollapseManager, useCollapse } from './collapse-manager.js';
export type { CollapseManagerProps, CollapseState } from './collapse-manager.js';

export { registerPlugin, getPlugin, listPlugins, registerAndGetId } from '../registry/index.js';
export type { ChartPlugin, ViewSpec, RendererProps } from '../registry/types.js';
export { createNativePlugin } from '../registry/native-plugin.js';
export type { NativeChartProps, NativeConfig } from '../registry/native-plugin.js';

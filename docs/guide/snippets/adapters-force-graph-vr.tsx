// Bring-your-own-Renderer recipe for react-force-graph-vr and -ar. Lumagrid ships no code for them.
// The component type is declared locally so this file compiles without the (untyped) VR package.

// #region force-graph-vr
import type { ComponentType } from 'react';
import { registerPlugin } from 'lumagrid';
import { createForceGraphPlugin, themeRfgData } from 'lumagrid/plugins';

// In an app: import ForceGraphVR from 'react-force-graph-vr';
interface VrProps {
  graphData: { nodes: object[]; links: object[] };
  backgroundColor: string;
  linkColor: () => string;
  nodeLabel: string;
}
declare const ForceGraphVR: ComponentType<VrProps>;

// The VR canvas fills the headset, so width and height are ignored.
registerPlugin(
  createForceGraphPlugin({
    id: 'rfg-vr',
    label: 'Force graph (VR)',
    variant: '3d',
    Renderer: ({ data, theme }) => (
      <ForceGraphVR
        graphData={themeRfgData(data, theme)}
        backgroundColor={theme.backgroundColor}
        linkColor={() => theme.linkColor}
        nodeLabel="name"
      />
    ),
  }),
);
// #endregion

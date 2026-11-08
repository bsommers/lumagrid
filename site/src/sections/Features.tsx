import React from 'react';
import pipelineUrl from '../../../docs/assets/diagrams/pipeline.svg';
import pluginArchitectureUrl from '../../../docs/assets/diagrams/plugin-architecture.svg';
import './features.css';

/** Features strip: the pipeline, theming and plugin story, with the two neon diagrams. */
export function Features(): React.ReactElement {
  return (
    <section id="features" className="lg-features" aria-labelledby="features-title">
      <h2 id="features-title" className="lg-features-title">
        Built in layers
      </h2>
      <p className="lg-features-intro">
        Each layer does one job and imports only from the layers below it, so you can swap a
        transform, a theme or a renderer without touching the rest.
      </p>

      <div className="lg-feature">
        <div className="lg-feature-copy">
          <h3>Transforms to registry to renderers</h3>
          <p>
            Raw data of any shape runs through transforms (flatten, aggregate, pivot, groupBy,
            geoNormalize) into one uniform TransformedData value. A plugin registry hands it to
            the renderer you pick.
          </p>
        </div>
        <img
          className="lg-feature-diagram"
          src={pipelineUrl}
          width={960}
          height={320}
          loading="lazy"
          alt="Pipeline diagram: raw data flows through transforms into TransformedData, then through the plugin registry to a renderer, with the theme feeding the registry."
        />
      </div>

      <div className="lg-feature">
        <div className="lg-feature-copy">
          <h3>Themeable by design</h3>
          <p>
            ThemeProvider and ThemeDefinition tokens style every chart from one place. The gallery
            below switches between the neon, dark and light themes live.
          </p>
        </div>
      </div>

      <div className="lg-feature">
        <div className="lg-feature-copy">
          <h3>Plugins, not lock-in</h3>
          <p>
            The ChartPlugin contract is the only seam. The seven native SVG charts use it, and so
            do the D3, Recharts and Nivo adapters, so you can bring your own renderer.
          </p>
        </div>
        <img
          className="lg-feature-diagram"
          src={pluginArchitectureUrl}
          loading="lazy"
          alt="Plugin architecture diagram: native charts and the D3, Recharts and Nivo adapters all implement the ChartPlugin contract registered with the plugin registry."
        />
      </div>
    </section>
  );
}

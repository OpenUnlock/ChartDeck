# ChartDeck attribution

ChartDeck by OpenUnlock is a wrapper application and fork of [kanaries/graphic-walker](https://github.com/kanaries/graphic-walker), distributed under the Apache License, Version 2.0. The upstream project is copyright Kanaries Data Inc. and its contributors. Its root `LICENSE`, package notices, and upstream source files under `packages/` are preserved unchanged by the ChartDeck wrapper.

The Apache-2.0 license permits redistribution and modification subject to its terms. This file is an attribution summary, not legal advice. Consult the preserved license and notices for the complete terms and any file-specific attribution.

## Wrapper additions by OpenUnlock

- `/chartdeck-app/`: isolated Next.js App Router application, dependencies, routes, and Vercel deployment configuration.
- `/chartdeck-app/app/`: ChartDeck landing page and browser-only workspace route.
- `/chartdeck-app/components/`: local session gate, Graphic Walker workspace shell, BYOK configuration, and landing UI.
- `/chartdeck-app/lib/`: sample dataset, field metadata, local session types, and direct-to-provider BYOK requests.
- `/index.html`: self-contained static landing page for GitHub Pages.
- `/vercel.json`: Vercel install/build configuration for the wrapper in `/chartdeck-app`.
- `/.github/workflows/sync-upstream.yml`: scheduled and manually dispatched upstream synchronization workflow.
- `/ATTRIBUTION.md`: this wrapper-attribution record.

The wrapper keeps Google profile data, guest session state, and BYOK settings in the user's browser. ChartDeck AI requests are sent directly to the provider selected by the user. The workspace export contains the dataset, field metadata, and chart specifications only when the user explicitly downloads a JSON file. There is no ChartDeck database or server-side AI proxy in this wrapper.

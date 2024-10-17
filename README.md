# MongoDB Documentation Platform Netlify Extensions

This repository contains the integrations/extensions that are used for documentation site builds.

## linting/formatting with Biome

To install the linter, run `npm ci` at the root level of the project. From there, you can install the Biome Extension for VS Code to display linting errors.

For auto-formatting on save, add this configuration to your `settings.json`:

```json
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnPaste": true, // required
    "editor.formatOnType": false, // required
    "editor.formatOnSaveMode": "file", // required to format on save
    "files.autoSave": "onFocusChange" // optional but recommended
  },

```

For more information on Biome, check out their [documentation](https://biomejs.dev/guides/getting-started/)

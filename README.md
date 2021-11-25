# Sketch Fusion

Sketch Fusion applies themes to Design System documents.
To do this, it replaces styles, colors or symbols in a source document with those defined in a theme file.

## Requirements

Sketch Fusion works on any system with `node.js` installed, and does not need Sketch installed. We have included a GitHub Action in this repository, which you can use to run it automatically on your own repository.

## How it works

To use Sketch Fusion, you need:

- a source Sketch document, where we define base styles, colors and symbols.
- a theme file, which defines the styles, colors and symbols to apply to the source document. Sketch Fusion uses the names of the symbols and colors defined in the theme file to match them to the source document. You can optionally reuse the IDs of the symbols and colors defined in the source document.
- optionally, a target Sketch document to save the results to. This is highly discouraged, as it breaks the single source of truth principle, but is useful in some scenarios.

Sketch Fusion will ignore any extra information in the theme file.

# Sketch Fusion

Sketch Fusion applies themes to Design System documents.
To do this, it replaces styles, colors or symbols in a source document with those defined in a theme file.

## Requirements

Sketch Fusion works on any system with `node.js` installed, and does not need Sketch installed. We have included a GitHub Action in this repository, which you can use to run it automatically on your own repository.

## How it works

To use Sketch Fusion, you need these files:

- `source.sketch`: a source Sketch document, where we define base styles, colors and symbols.
- `theme.sketch`: a theme file, which defines the styles, colors and symbols to apply to the source document. Sketch Fusion uses the names of the symbols and colors defined in the theme file to match them to the source document.
- `output.sketch`: optionally, you can reuse an existing Sketch document to save the results to. This is highly discouraged, as it breaks the single source of truth principle, but is useful in some scenarios. For example, if you already have a file you've created using Camilo or another tool, you can use it as the output document. Otherwise, Sketch Fusion will create it automatically.

Sketch Fusion will ignore any extra information in the theme file.

Once you have the files, you can run the following commands:

```bash
npm install
```

to install the dependencies. And then

```bash
npm start
```

to run the tool and generate the output.

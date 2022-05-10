# Sketch Fusion

Sketch Fusion applies themes to Design System documents.
To do this, it replaces styles, colors or symbols in a source document with those defined in a theme file.

We have a demo running at [https://fusion.sketchplugins.com](https://fusion.sketchplugins.com) if you want to try it out without installing anything.

## Requirements and Setup

Sketch Fusion works on any system with `node.js` installed, and does not need Sketch installed. You can even run it on GitHub Actions using the template provided in `.github/workflows/fusion.yml`.

To run the project locally, follow these steps:

1. Open a terminal, and clone the repo using `git clone https://github.com/sketch-hq/sketch-fusion`
2. `cd sketch-fusion`
3. Run `npm install` to install all dependencies.
4. Run `npm start` to start the web server. It should be available at <http://localhost:3000/>

## How it works

To use Sketch Fusion, you need these files:

- `source.sketch`: a source Sketch document, where you define base styles, colors and symbols.
- `theme.sketch`: a theme file, which defines the styles, colors and symbols to apply to the source document. Sketch Fusion uses the names of the symbols and colors defined in the theme file to match them to the source document. It will also inject any Artboard that's present in the theme file.
- `output.sketch`: (optional). If you want to replace a Workspace document, you can upload it here and Fusion will extract the sharing information from it. Fusion will ignore any other data in the file.

## Replacing Workspace documents

To replace an existing Workspace document, open the output from Fusion in Sketch and click the "Collaborate" icon. Sketch will ask if you want to overwrite an existing Workspace document. Select the document you want to overwrite, and Sketch will replace the document in the Workspace with your new version.

# Sketch Fusion

Sketch Fusion applies themes to Design System documents.
To do this, it replaces styles, colors or symbols in a source document with those defined in a theme file.

We have a demo running at [https://fusion.sketchplugins.com](https://fusion.sketchplugins.com) if you want to try it out without installing anything.

## Disclaimer

While we've tried to make sure Sketch Fusion works for most themeing scenarios, it is not meant to be a complete solution. Depending on your use case, you may need to implement your own logic to handle the different scenarios. We've added comments in the code to help you get started, and are always happy to help you if you need a hand. Reach out to your Sketch CSM, or get in touch with us at developer@sketch.com if you want to customize Sketch Fusion.

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

## Known Issues

If you run Fusion on a server with `mod_security` enabled, you may experience a "500 Internal Server Error". This happens if your filenames include emoji characters. The two workarounds we have identified are to:

- Disabling `mod_security` in the server configuration
- Using a different filename for the document(s)

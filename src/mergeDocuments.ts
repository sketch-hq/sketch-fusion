import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { toFile, SketchFile } from '@sketch-hq/sketch-file'
import path from 'path'
import * as fs from 'fs'
import archiver from 'archiver'
import AdmZip from 'adm-zip'
import { v4 as uuidv4 } from 'uuid'

import { allLayers, allTextLayers, sublayers } from './allLayers'
import { allSymbolInstances } from './allSymbolInstances'
import { allSymbolMasters, allSymbolMastersWithPage } from './allSymbolMasters'
import { cleanupColorsInLayer } from './cleanupColorsInLayer'
import { colorsAreEqual } from './colorsAreEqual'
import { getElementByID } from './getElementByID'
import { getElementByName } from './getElementByName'
import { getSymbolMaster } from './getSymbolMaster'
import { injectDynamicData } from './injectDynamicData'
import { injectSymbol } from './injectSymbol'
import { matchingLayerStyle } from './matchingLayerStyle'
import { matchingSwatchForColorInSwatches } from './matchingSwatchForColorInSwatches'
import { mergeColors } from './mergeColors'
import { mergeLayerStyles } from './mergeLayerStyles'
import { mergeTextStyles } from './mergeTextStyles'
import { resetStyle } from './resetStyle'

export const options = require(path.resolve(__dirname, '../config.json'))
const data = require(path.resolve(__dirname, '../data.json'))

export async function mergeDocuments(
  sourceDocument: SketchFile,
  themeDocument: SketchFile,
  outputOptions: {
    id: string
    fileName: string
    documentState?: {}
    cloudShare?: {}
  }
): Promise<string> {
  const sourceFileName = path.basename(sourceDocument.filepath, '.sketch')
  const themeFileName = path.basename(themeDocument.filepath, '.sketch')

  console.log(
    `\n\nMerging documents "${sourceFileName}" and "${themeFileName}"\n`
  )

  // Create a new document that is a copy of the source document...
  let outputDocument: SketchFile = JSON.parse(JSON.stringify(sourceDocument))
  // ...and store the data we got in the function call:
  outputDocument.contents.document.do_objectID = outputOptions.id
  outputDocument.filepath = outputOptions.fileName
  outputDocument.contents.user.document.cloudShare = outputOptions.cloudShare
  outputDocument.contents.document.documentState = outputOptions.documentState

  // 1. Merge Colors
  console.log(`Step 1: 🎨 Merging Colors`)
  outputDocument.contents.document.sharedSwatches = mergeColors(
    sourceDocument.contents.document.sharedSwatches,
    themeDocument.contents.document.sharedSwatches
  )

  // 2. Merge Layer Styles
  console.log(`Step 2: 💅 Merging Layer Styles`)
  outputDocument.contents.document.layerStyles = mergeLayerStyles(
    sourceDocument.contents.document.layerStyles,
    themeDocument.contents.document.layerStyles
  )

  // 3. Merge Text Styles
  console.log(`Step 3: 📚 Merging Text Styles`)
  outputDocument.contents.document.layerTextStyles = mergeTextStyles(
    sourceDocument,
    themeDocument
  )

  // 4. Merge Symbols
  console.log(`Step 4: 💠 Merging Symbols`)
  // First, inject the symbols from the source document, as they may have changed:
  allSymbolMastersWithPage(sourceDocument).forEach((symbolObject) => {
    outputDocument = injectSymbol(
      symbolObject.symbol,
      outputDocument,
      symbolObject.page.name
    )
  })
  // Then, inject the symbols from the theme document:
  allSymbolMastersWithPage(themeDocument).forEach((symbolObject) => {
    outputDocument = injectSymbol(
      symbolObject.symbol,
      outputDocument,
      symbolObject.page.name
    )
  })

  // TODO: Use the page name to determine which Artboards to inject. Otherwise, we'll inject the first Artboard matching the name, which is not what we want.
  console.log(`Step 5: 📦 Merging Layers (Artboards, by now)`)
  outputDocument.contents.document.pages.forEach((page) => {
    page.layers.forEach((layer) => {
      if (layer._class === 'artboard') {
        const themeArtboard = getElementByName(layer.name, themeDocument)
        if (
          themeArtboard !== undefined &&
          themeArtboard._class === 'artboard'
        ) {
          for (const property in layer) {
            if (layer.hasOwnProperty(property)) {
              layer[property] = themeArtboard[property]
            }
          }
        }
      }
    })
  })

  // 5. Now we need to make sure that all the layers are using the new styles and colors
  // Although we could just do this when we inject the relevant items, we'll do it here
  // to make sure that all the pieces are now in place
  console.log(`Step 6: 🆕 Update references:`)
  const swatches = outputDocument.contents.document.sharedSwatches
  const layerStyles = outputDocument.contents.document.layerStyles.objects
  const textStyles = outputDocument.contents.document.layerTextStyles.objects
  const allStyles: FileFormat.SharedStyle[] = [...layerStyles, ...textStyles]
  const allOutputLayers = allLayers(outputDocument)

  console.debug(`  ⮑  🎨 Colors`)
  allOutputLayers.forEach((layer) => {
    layer = cleanupColorsInLayer(layer, swatches)
    layer = injectDynamicData(layer, data)
  })

  console.log(`  ⮑  💅 Layer Styles`)
  layerStyles.forEach((style) => {
    style.value.fills?.forEach((fill) => {
      if (fill.color.swatchID !== undefined) {
        const matchingSwatch = matchingSwatchForColorInSwatches(
          fill.color,
          swatches
        )
        if (
          matchingSwatch &&
          !colorsAreEqual(fill.color, matchingSwatch.value)
        ) {
          fill.color = {
            ...matchingSwatch.value,
            swatchID: matchingSwatch.do_objectID,
          }
        }
      }
    })
    style.value.borders?.forEach((border) => {
      if (border.color.swatchID !== undefined) {
        const matchingSwatch = matchingSwatchForColorInSwatches(
          border.color,
          swatches
        )
        if (
          matchingSwatch &&
          !colorsAreEqual(border.color, matchingSwatch.value)
        ) {
          border.color = {
            ...matchingSwatch.value,
            swatchID: matchingSwatch.do_objectID,
          }
        }
      }
    })
    style.value.shadows?.forEach((shadow) => {
      if (shadow.color.swatchID !== undefined) {
        const matchingSwatch = matchingSwatchForColorInSwatches(
          shadow.color,
          swatches
        )
        if (
          matchingSwatch &&
          !colorsAreEqual(shadow.color, matchingSwatch.value)
        ) {
          shadow.color = {
            ...matchingSwatch.value,
            swatchID: matchingSwatch.do_objectID,
          }
        }
      }
    })
    style.value.innerShadows?.forEach((shadow) => {
      if (shadow.color.swatchID !== undefined) {
        const matchingSwatch = matchingSwatchForColorInSwatches(
          shadow.color,
          swatches
        )
        if (
          matchingSwatch &&
          !colorsAreEqual(shadow.color, matchingSwatch.value)
        ) {
          shadow.color = {
            ...matchingSwatch.value,
            swatchID: matchingSwatch.do_objectID,
          }
        }
      }
    })
  })
  allOutputLayers.forEach((layer) => {
    layer = resetStyle(layer, allStyles)
  })

  console.log(`  ⮑  📚 Text Styles`)
  textStyles.forEach((style) => {
    // console.log(`    ⮑  Updating references to style: ${style.name}`)
    // console.log(`\tFills`)
    style.value.fills?.forEach((fill) => {
      if (fill.color && fill.color.swatchID !== undefined) {
        const matchingSwatch = matchingSwatchForColorInSwatches(
          fill.color,
          swatches
        )
        if (
          matchingSwatch &&
          !colorsAreEqual(fill.color, matchingSwatch.value)
        ) {
          fill.color = {
            ...matchingSwatch.value,
            swatchID: matchingSwatch.do_objectID,
          }
        }
      }
    })
    // console.log(`\tBorders`)
    style.value.borders?.forEach((border) => {
      if (border.color.swatchID !== undefined) {
        const matchingSwatch = matchingSwatchForColorInSwatches(
          border.color,
          swatches
        )
        if (
          matchingSwatch &&
          !colorsAreEqual(border.color, matchingSwatch.value)
        ) {
          border.color = {
            ...matchingSwatch.value,
            swatchID: matchingSwatch.do_objectID,
          }
        }
      }
    })
    // console.log(`\tShadows`)
    style.value.shadows?.forEach((shadow) => {
      if (shadow.color.swatchID !== undefined) {
        const matchingSwatch = matchingSwatchForColorInSwatches(
          shadow.color,
          swatches
        )
        if (
          matchingSwatch &&
          !colorsAreEqual(shadow.color, matchingSwatch.value)
        ) {
          shadow.color = {
            ...matchingSwatch.value,
            swatchID: matchingSwatch.do_objectID,
          }
        }
      }
    })
    // console.log(`\tInner Shadows`)
    style.value.innerShadows?.forEach((shadow) => {
      if (shadow.color.swatchID !== undefined) {
        const matchingSwatch = matchingSwatchForColorInSwatches(
          shadow.color,
          swatches
        )
        if (
          matchingSwatch &&
          !colorsAreEqual(shadow.color, matchingSwatch.value)
        ) {
          shadow.color = {
            ...matchingSwatch.value,
            swatchID: matchingSwatch.do_objectID,
          }
        }
      }
    })

    // console.log(`\tText`)
    const textColor: FileFormat.Color =
      style.value.textStyle.encodedAttributes.MSAttributedStringColorAttribute
    if (textColor?.swatchID !== undefined) {
      const matchingSwatch = matchingSwatchForColorInSwatches(
        textColor,
        swatches
      )
      if (matchingSwatch && !colorsAreEqual(textColor, matchingSwatch.value)) {
        style.value.textStyle.encodedAttributes.MSAttributedStringColorAttribute =
          { ...matchingSwatch.value, swatchID: matchingSwatch.do_objectID }
      }
    }
    // Update text layers that reference old style IDs
    if (style.name.includes('💠💠💠💠💠💠')) {
      const [name, oldId] = style.name.split('💠💠💠💠💠💠')
      style.name = name
      const layersUsingOldId = allTextLayers(outputDocument).filter(
        (text) => text.sharedStyleID === oldId
      )
      layersUsingOldId.forEach((layer) => {
        // Reference the new style ID...
        layer.sharedStyleID = style.do_objectID
        // ...and update the attributes of the text to reflect the ones in the new style:
        // First, update the style attributes...
        layer.style = JSON.parse(JSON.stringify(style.value))
        // ...and then update the text attributes. We will overwrite all the data in the attributedString,
        // which may sometimes not be what we want. If the text has multiple attributes, they will be replaced
        // by the ones in the new style. This is not ideal, but it's a reasonable compromise for Design Systems.
        layer.attributedString.attributes[0].attributes = JSON.parse(
          JSON.stringify(style.value.textStyle.encodedAttributes)
        )
      })
    }
  })

  console.log(`  ⮑  💠 Symbol Overrides`)
  allSymbolInstances(outputDocument).forEach((symbolInstance) => {
    // for all the instances on the output document
    // make sure their overrides now point to the layer IDs
    // of the new symbol masters

    if (symbolInstance.overrideValues.length > 0) {
      const master: FileFormat.SymbolMaster = getSymbolMaster(
        symbolInstance,
        outputDocument
      )
      if (master === undefined) {
        // This means it comes from a shared Library
        console.log(`\t⮑  No local Symbol Master for "${symbolInstance.name}"`)
      } else {
        symbolInstance.overrideValues?.forEach((override) => {
          /**
           * I'm going to asume that if all IDs on an override path
           * exist in the master, then it's a valid override path. Otherwise,
           * this will never be done.
           */
          const [path, type] = override.overrideName.split('_')
          const overridePathComponents = path.split('/')

          const masterLayers = sublayers(master)
          const layerIDs = masterLayers.map((layer) => layer.do_objectID)

          let updateOverride = false
          overridePathComponents.forEach((component, index) => {
            if (!layerIDs.includes(component)) {
              const originalOverrideLayer = getElementByID(
                component,
                sourceDocument
              )
              if (originalOverrideLayer) {
                const originalOverrideLayerName = originalOverrideLayer.name
                // Get the first layer in the master that has the same name as the original override
                // This is not bulletproof, but it's good enough for now
                const newOverrideLayer = masterLayers.find(
                  (layer) => layer.name == originalOverrideLayerName
                )
                if (newOverrideLayer !== undefined) {
                  overridePathComponents[index] = newOverrideLayer.do_objectID
                  updateOverride = true
                }
              }
            }
          })
          if (updateOverride) {
            console.log(`\t⮑  Updating override "${override.overrideName}"`)
            override.overrideName =
              overridePathComponents.join('/') + '_' + type
          }
        })
      }
    }
  })

  return new Promise((resolve, reject) => {
    toFile(outputDocument).then(() => {
      // Now we need to inject the binary assets into the output file
      // This is a workaroud for a bug in our file format tooling, that
      // we'll fix soon.

      // Make a temp folder inside our uploads folder
      const tempFolder = path.resolve(__dirname, '../tmp/', uuidv4())
      fs.mkdirSync(tempFolder, { recursive: true })
      const sourceFolder = path.resolve(tempFolder, 'source')
      const outputFolder = path.resolve(tempFolder, 'output')

      let needsToBeZipped = false
      const sourceZip = new AdmZip(sourceDocument.filepath)
      sourceZip.extractAllTo(sourceFolder, true)

      const outputZip = new AdmZip(outputDocument.filepath)
      outputZip.extractAllTo(outputFolder, true)

      if (fs.existsSync(path.resolve(sourceFolder, 'fonts'))) {
        needsToBeZipped = true
        fs.renameSync(
          path.resolve(sourceFolder, 'fonts'),
          path.resolve(outputFolder, 'fonts')
        )
      }
      if (fs.existsSync(path.resolve(sourceFolder, 'images'))) {
        needsToBeZipped = true
        fs.renameSync(
          path.resolve(sourceFolder, 'images'),
          path.resolve(outputFolder, 'images')
        )
      }

      if (needsToBeZipped) {
        const output = fs.createWriteStream(outputDocument.filepath)
        let archive = archiver('zip')
        archive.pipe(output)
        archive.directory(path.resolve(outputFolder), false)
        output.on('close', () => {
          fs.rmdirSync(tempFolder, { recursive: true })
          resolve(outputDocument.filepath)
        })
        archive.finalize()
      } else {
        fs.rmdirSync(tempFolder, { recursive: true })
        resolve(outputDocument.filepath)
      }
    })
  })
}

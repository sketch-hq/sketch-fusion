import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { toFile, SketchFile } from '@sketch-hq/sketch-file'
import path from 'path'
import * as fs from 'fs'
import archiver from 'archiver'
import AdmZip from 'adm-zip'
import { v4 as uuidv4 } from 'uuid'

import { allLayers, allTextLayers, sublayers } from './allLayers'
import { allSymbolInstances } from './allSymbolInstances'
import { allSymbolMasters } from './allSymbolMasters'
import { cleanupColorsInLayer } from './cleanupColorsInLayer'
import { colorsAreEqual } from './colorsAreEqual'
import { getSymbolMaster } from './getSymbolMaster'
import { injectDynamicData } from './injectDynamicData'
import { injectSymbol } from './injectSymbol'
import { matchingSwatchForColorInSwatches } from './matchingSwatchForColorInSwatches'
import { mergeColors } from './mergeColors'
import { mergeLayerStyles } from './mergeLayerStyles'
import { mergeTextStyles } from './mergeTextStyles'
import { resetStyle } from './resetStyle'
import getElementByID from './getElementByID'
import newOverrideName from './newOverrideName'
import { matchingLayerStyle } from './matchingLayerStyle'

export const options = require(path.resolve(__dirname, '../config.json'))
const data = require(path.resolve(__dirname, '../data.json'))

export async function mergeDocuments(
  sourceDocument: SketchFile,
  themeDocument: SketchFile,
  outputDocument: SketchFile
): Promise<string> {
  const sourceFileName = path.basename(sourceDocument.filepath, '.sketch')
  const themeFileName = path.basename(themeDocument.filepath, '.sketch')
  console.log(
    `\n\nMerging documents "${sourceFileName}" and "${themeFileName}"\n`
  )

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
  // TODO: ↓↓ we can skip this step if we're not using the output document
  allSymbolMasters(sourceDocument).forEach((symbol) => {
    // console.log(
    //   `  Injecting ${symbol.name} (${symbol.symbolID}) from source document`
    // )
    outputDocument = injectSymbol(symbol, outputDocument)
  })
  // Then, inject the symbols from the theme document:o
  allSymbolMasters(themeDocument).forEach((symbol) => {
    // console.log(
    //   `  Injecting ${symbol.name} (${symbol.symbolID}) from theme document`
    // )
    outputDocument = injectSymbol(symbol, outputDocument)
  })

  // 5. Now we need to make sure that all the layers are using the new styles and colors
  // Although we could just do this when we inject the relevant items, we'll do it here
  // to make sure that all the pieces are now in place
  console.log(`Step 5: 🆕 Update references:`)

  const swatches = outputDocument.contents.document.sharedSwatches
  const layerStyles = outputDocument.contents.document.layerStyles.objects
  const textStyles = outputDocument.contents.document.layerTextStyles.objects
  const allStyles: FileFormat.SharedStyle[] = [...layerStyles, ...textStyles]

  console.debug(`  ⮑  🎨 Colors`)
  allLayers(outputDocument).forEach((layer) => {
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
  allLayers(outputDocument).forEach((layer) => {
    layer = resetStyle(layer, allStyles)
  })

  console.log(`  ⮑  📚 Text Styles`)
  textStyles.forEach((style) => {
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
  })
  // Update text layers that reference old style IDs that may have changed after merging
  const styledTextLayers = allTextLayers(outputDocument).filter((text) => {
    return text.sharedStyleID !== undefined
  })
  styledTextLayers.forEach((text: FileFormat.Text) => {
    // console.log(`    ⮑  📝 Text Layer: ${text.name}`)
    // console.log(`        ${text.sharedStyleID}`)
    // console.log(`        ${text.userInfo}`)

    const matchingStyle: FileFormat.SharedStyle = matchingLayerStyle(
      text.sharedStyleID,
      textStyles
    )

    if (!matchingStyle) {
      // There's not an style matching this layer's style ID,
      // so we'll find the closest match using the metadata we injected
      // into the layer's userInfo back in `mergeTextStyles`
      if (text.userInfo?.previousTextStyle) {
        const closestStyle: FileFormat.SharedStyle = textStyles.filter(
          (style) => {
            return style.name == text.userInfo.previousTextStyle.name
          }
        )[0]
        text.sharedStyleID = closestStyle.do_objectID
        text.style = closestStyle.value
        const stringAttributes = text.attributedString.attributes
        stringAttributes.forEach((attribute) => {
          attribute.attributes.MSAttributedStringFontAttribute =
            closestStyle.value.textStyle.encodedAttributes.MSAttributedStringFontAttribute
          attribute.attributes.MSAttributedStringColorAttribute =
            closestStyle.value.textStyle.encodedAttributes.MSAttributedStringColorAttribute
          attribute.attributes.paragraphStyle =
            closestStyle.value.textStyle.encodedAttributes.paragraphStyle
        })
      }
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
        symbolInstance.overrideValues?.forEach((overrideValue) => {
          /**
           * I'm going to asume that if all IDs on an override path
           * exist in the document, then it's a valid override path. Otherwise,
           * this will never be done.
           */
          const overridePathComponents = overrideValue.overrideName
            .split('_')[0]
            .split('/')

          const layerIDs = sublayers(master).map((layer) => layer.do_objectID)
          const overrideType = overrideValue.overrideName.split('_')[1]
          let updateOverride = false
          overridePathComponents.forEach((component, index) => {
            if (!layerIDs.includes(component)) {
              const originalOverrideLayer = getElementByID(
                component,
                sourceDocument
              )
              if (originalOverrideLayer) {
                const originalOverrideLayerName = originalOverrideLayer.name
                // Get the first layer that has the same name as the original override
                // This is not bulletproof, but it's good enough for now
                // const newOverrideLayer = sublayers(master).filter((layer) => {
                const newOverrideLayer = allLayers(outputDocument).filter(
                  (layer) => {
                    return layer.name == originalOverrideLayerName
                  }
                )[0]

                if (newOverrideLayer !== undefined) {
                  overridePathComponents[index] = newOverrideLayer.do_objectID
                  updateOverride = true
                }
              }
            }
          })
          if (updateOverride) {
            overrideValue.overrideName =
              overridePathComponents.join('/') + '_' + overrideType
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
      // TODO: ↓↓ use the outputDocument.filepath to make this less brittle
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

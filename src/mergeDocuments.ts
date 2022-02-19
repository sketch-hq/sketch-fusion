import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { toFile, SketchFile } from '@sketch-hq/sketch-file'
import path from 'path'
import * as fs from 'fs'
import archiver from 'archiver'
import AdmZip from 'adm-zip'
import { v4 as uuidv4 } from 'uuid'

import { mergeStyles } from './mergeStyles'
import { mergeColors } from './mergeColors'
import { injectSymbol } from './injectSymbol'
import { injectDynamicData } from './inject-dynamic-data'
import { cleanupColorsInLayer } from './cleanupColorsInLayer'
import { colorsAreEqual } from './colorsAreEqual'
import { matchingSwatchForColorInSwatches } from './matchingSwatchForColorInSwatches'
import { resetStyle } from './resetStyle'
import { allLayers } from './allLayers'

export const options = require(path.resolve(__dirname, '../config.json'))
const data = require(path.resolve(__dirname, '../data.json'))

export async function mergeDocuments(
  sourceDocument: SketchFile,
  themeDocument: SketchFile,
  outputDocument: SketchFile
): Promise<string> {
  console.log('\n\nMerging documents...')

  // 1. Merge Colors
  console.log(`Step 1: 🎨 Merging Colors`)
  outputDocument.contents.document.sharedSwatches = mergeColors(
    sourceDocument.contents.document.sharedSwatches,
    themeDocument.contents.document.sharedSwatches
  )

  // 2. Merge Layer Styles
  console.log(`Step 2: 💅 Merging Layer Styles`)
  outputDocument.contents.document.layerStyles = mergeStyles(
    sourceDocument.contents.document.layerStyles,
    themeDocument.contents.document.layerStyles,
    'sharedStyleContainer'
  )

  // 3. Merge Text Styles
  console.log(`Step 3: 📚 Merging Text Styles`)
  outputDocument.contents.document.layerTextStyles = mergeStyles(
    sourceDocument.contents.document.layerTextStyles,
    themeDocument.contents.document.layerTextStyles,
    'sharedTextStyleContainer'
  )

  // 4. Merge Symbols
  console.log(`Step 4: 💠 Merging Symbols`)
  // First, inject the symbols from the source document, as they may have changed:
  // TODO: ↓↓ we can skip this step if we're not using the output document
  allLayers(sourceDocument).forEach((symbol: FileFormat.SymbolMaster) => {
    if (symbol._class === 'symbolMaster') {
      console.log(`  Injecting ${symbol.name} from source document`)
      outputDocument = injectSymbol(symbol, outputDocument)
    }
  })
  // Then, inject the symbols from the theme document:o
  allLayers(themeDocument).forEach((symbol: FileFormat.SymbolMaster) => {
    if (symbol._class === 'symbolMaster') {
      console.log(`  Injecting ${symbol.name} from theme document`)
      outputDocument = injectSymbol(symbol, outputDocument)
    }
  })

  // 5. Now we need to make sure that all the layers are using the new styles and colors
  // Although we could just do this when we inject the relevant items, we'll do it here
  // to make sure that all the pieces are now in place
  console.log(`Step 5: 🆕 Update references:`)

  const swatches = outputDocument.contents.document.sharedSwatches
  const layerStyles = outputDocument.contents.document.layerStyles.objects
  const textStyles = outputDocument.contents.document.layerTextStyles.objects
  const allStyles: FileFormat.SharedStyle[] = [...layerStyles, ...textStyles]
  const pages = outputDocument.contents.document.pages

  console.debug(`  ⮑  🎨 Colors`)
  allLayers(outputDocument).forEach((layer) => {
    layer = cleanupColorsInLayer(layer, swatches)
    layer = injectDynamicData(layer, data)
  })
  // pages.forEach((page: FileFormat.Page) => {
  //   page.layers.forEach((layer) => {
  //     layer = cleanupColorsInLayer(layer, swatches)
  //     layer = injectDynamicData(layer, data)
  //   })
  // })

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

  console.log(`  ⮑  💠 Symbols (PENDING)`)

  console.log(`  ⮑  🟧 Layers (PENDING)`)
  allLayers(outputDocument).forEach((layer) => {
    layer = resetStyle(layer, allStyles)
  })
  // pages.forEach((page) => {
  //   page.layers.forEach((layer) => {
  //     layer = resetStyle(layer, allStyles)
  //   })
  // })

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

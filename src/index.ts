import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { fromFile, toFile, SketchFile } from '@sketch-hq/sketch-file'
import path from 'path'
import * as fs from 'fs'
import archiver from 'archiver'
import AdmZip from 'adm-zip'
import { v4 as uuidv4 } from 'uuid'

const options = require(path.resolve(__dirname, '../config.json'))
const data = require(path.resolve(__dirname, '../data.json'))

async function mergeDocuments(
  sourceDocument: SketchFile,
  themeDocument: SketchFile,
  outputDocument: SketchFile
): Promise<string> {
  console.log('Merging documents:')
  console.log(
    `  Source: ${sourceDocument.filepath}, ID: ${sourceDocument.contents.document.do_objectID}`
  )
  console.log(
    `  Theme: ${themeDocument.filepath}, ID: ${themeDocument.contents.document.do_objectID}`
  )
  console.log(
    `  Output: ${outputDocument.filepath}, ID: ${outputDocument.contents.document.do_objectID}`
  )
  // 1. Merge Layer Styles
  // console.log(`Merging Layer Styles`)
  outputDocument.contents.document.layerStyles = mergeStyles(
    sourceDocument.contents.document.layerStyles,
    themeDocument.contents.document.layerStyles,
    'sharedStyleContainer'
  )

  // 2. Merge Text Styles
  // console.log(`Merging Text Styles`)
  outputDocument.contents.document.layerTextStyles = mergeStyles(
    sourceDocument.contents.document.layerTextStyles,
    themeDocument.contents.document.layerTextStyles,
    'sharedTextStyleContainer'
  )

  // 3. Merge Colors
  // console.log(`Merging Colors`)
  outputDocument.contents.document.sharedSwatches = mergeColors(
    sourceDocument.contents.document.sharedSwatches,
    themeDocument.contents.document.sharedSwatches
  )

  // 4. Merge Symbols
  // console.log(`Merging Symbols`)
  // First, inject the symbols from the source document, as they may have changed:
  // TODO: we can skip this step if we're not using the output document
  // I am commenting this out for now, because it breaks my demo
  sourceDocument.contents.document.pages.forEach((page: FileFormat.Page) => {
    page.layers.forEach((symbol: FileFormat.SymbolMaster) => {
      if (symbol._class === 'symbolMaster') {
        outputDocument = injectSymbol(symbol, outputDocument)
      }
    })
  })
  // Then, inject the symbols from the theme document:o
  themeDocument.contents.document.pages.forEach((page: FileFormat.Page) => {
    page.layers.forEach((symbol: FileFormat.SymbolMaster) => {
      if (symbol._class === 'symbolMaster') {
        outputDocument = injectSymbol(symbol, outputDocument)
      }
    })
  })

  // 5. Now we need to make sure that all the layers are using the new styles and colors
  // Although we could just do this when we inject the relevant items, we'll do it here
  // to make sure that all the pieces are now in place
  // console.log(`One final pass to update all the styles and colors`)
  const swatches = outputDocument.contents.document.sharedSwatches

  outputDocument.contents.document.pages.forEach((page: FileFormat.Page) => {
    page.layers.forEach((layer) => {
      layer = cleanupColorsInLayer(layer, swatches)
      layer = injectDynamicData(layer, data)
    })
  })
  // 6. Update layer styles
  outputDocument.contents.document.layerStyles.objects.forEach((style) => {
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
  // 7. Update text styles
  outputDocument.contents.document.layerTextStyles.objects.forEach((style) => {
    // console.log(`Updating Text Style: ${style.name}`)
    // console.log(style.value)
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

    const textColor: FileFormat.Color =
      style.value.textStyle.encodedAttributes.MSAttributedStringColorAttribute
    if (textColor.swatchID !== undefined) {
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

  console.log(
    `We are now going to save ${outputDocument.filepath} (or at least try)`
  )

  return new Promise((resolve, reject) => {
    toFile(outputDocument).then(() => {
      // resolve(outputDocument.filepath)

      // Now we need to inject the binary assets into the output file
      // This is a workaroud for a bug in our file format tooling, that
      // we'll fix soon.

      // Make a temp folder inside our uploads folder
      // TODO: use the outputDocument.filepath to make this less brittle
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

// TODO: this really needs to be a three way merge if we want to properly
// reuse styles from the output document. We'll make it a preference, for people
// who want to publish both the source, output and theme documents.
function mergeStyles(
  sourceStyles:
    | FileFormat.SharedStyleContainer
    | FileFormat.SharedTextStyleContainer,
  themeStyles:
    | FileFormat.SharedStyleContainer
    | FileFormat.SharedTextStyleContainer,
  type
) {
  let combinedStyles = {
    _class: type,
    objects: [],
  }
  // First, we'll start with the styles from the source document
  combinedStyles.objects = sourceStyles.objects

  // Then we'll add the styles from the theme document
  themeStyles.objects.forEach((themeStyle: FileFormat.SharedStyle) => {
    const matchingStyle = combinedStyles.objects.find(
      (combinedStyle: FileFormat.SharedStyle) => {
        return combinedStyle.name === themeStyle.name
      }
    )
    // If the style is already in the source document, we'll replace it...
    if (matchingStyle) {
      if (options.reuseStyleID) {
        const originalStyle =
          combinedStyles.objects[combinedStyles.objects.indexOf(matchingStyle)]
        const originalID = originalStyle.do_objectID
        // We want to use the same ID as the original style
        themeStyle.do_objectID = originalID
      }
      combinedStyles.objects[combinedStyles.objects.indexOf(matchingStyle)] =
        themeStyle
    } else {
      // ...otherwise we'll add it to the collection
      combinedStyles.objects.push(themeStyle)
    }
  })
  return combinedStyles
}

function mergeColors(
  sourceColors: FileFormat.SwatchContainer,
  themeColors: FileFormat.SwatchContainer
): FileFormat.SwatchContainer {
  let combinedColors: FileFormat.SwatchContainer = {
    _class: 'swatchContainer',
    objects: [],
  }

  combinedColors = sourceColors
  themeColors.objects.forEach((themeColor: FileFormat.Swatch) => {
    const matchingColor = combinedColors.objects.find((color) => {
      return color.name === themeColor.name
    })
    if (matchingColor) {
      const originalColor =
        combinedColors.objects[combinedColors.objects.indexOf(matchingColor)]
      if (options.reuseStyleID) {
        const originalID = originalColor.do_objectID
        themeColor.do_objectID = originalID
      }
      combinedColors.objects[combinedColors.objects.indexOf(matchingColor)] =
        themeColor
    } else {
      combinedColors.objects.push(themeColor)
    }
  })
  return combinedColors
}

function injectSymbol(
  symbol: FileFormat.SymbolMaster,
  document: SketchFile
): SketchFile {
  // console.log(`Injecting ${symbol.symbolID} (${symbol.name})`)
  let foundSymbol = false
  document.contents.document.pages.forEach((page: FileFormat.Page) => {
    page.layers.forEach((existingSymbol: FileFormat.SymbolMaster) => {
      if (
        existingSymbol.name === symbol.name &&
        existingSymbol._class === 'symbolMaster'
      ) {
        // console.log(`\tSymbol is already in doc, replacing`)
        const originalSymbolID = existingSymbol.symbolID
        const originalObjectID = existingSymbol.do_objectID
        // This is the right way to do it, but it doesn't work
        for (const property in existingSymbol) {
          if (existingSymbol.hasOwnProperty(property)) {
            // console.log(`\t\t${property}`)
            existingSymbol[property] = symbol[property]
          }
        }
        // and this is the brute force way to do it:
        // layer = symbol
        // TODO: when we inject a new symbol, we need to make sure that the
        // new symbol maintains the same ID as the original symbol, OR that we
        // update all references to the original symbol to use the new symbol's ID
        existingSymbol.do_objectID = originalObjectID
        existingSymbol.symbolID = originalSymbolID
        // console.log(`The replaced symbol now has ID: ${originalID}`)
        foundSymbol = true
      }
    })
  })

  if (!foundSymbol) {
    // console.log(`\tSymbol is not in doc, adding`)
    let symbolPage: FileFormat.Page = document.contents.document.pages.find(
      (page) => {
        return page.name === 'Symbols'
      }
    )
    if (!symbolPage) {
      const newPage: FileFormat.Page = {
        name: 'Symbols',
        layers: [],
        _class: 'page',
        do_objectID: uuidv4(),
        booleanOperation: -1,
        isFixedToViewport: false,
        isFlippedHorizontal: false,
        isFlippedVertical: false,
        isLocked: false,
        isVisible: true,
        layerListExpandedType: 0,
        nameIsFixed: false,
        resizingConstraint: 63,
        resizingType: FileFormat.ResizeType.Stretch,
        rotation: 0,
        shouldBreakMaskChain: false,
        exportOptions: {
          _class: 'exportOptions',
          includedLayerIds: [],
          layerOptions: 0,
          shouldTrim: false,
          exportFormats: [],
        },
        frame: {
          _class: 'rect',
          constrainProportions: true,
          height: 0,
          width: 0,
          x: 0,
          y: 0,
        },
        clippingMaskMode: 0,
        hasClippingMask: false,
        hasClickThrough: true,
        groupLayout: { _class: 'MSImmutableFreeformGroupLayout' },
        horizontalRulerData: { _class: 'rulerData', base: 0, guides: [] },
        verticalRulerData: { _class: 'rulerData', base: 0, guides: [] },
      }
      document.contents.document.pages.push(newPage)
      symbolPage = document.contents.document.pages.find((page) => {
        return page.name === 'Symbols'
      })
    }

    // TODO: use a smarter way to find the right position to insert the symbol
    let maxX = -Infinity
    let maxY = -Infinity
    symbolPage.layers.forEach((layer: FileFormat.AnyLayer) => {
      maxX = Math.max(maxX, layer.frame.x + layer.frame.width)
      maxY = Math.max(maxY, layer.frame.y + layer.frame.height)
    })

    symbol.frame.x = maxX + 20
    symbol.frame.y = maxY + 20
    symbolPage.layers.push(symbol)
  }
  return document
}

export async function mergeFiles(fileArray: string[]): Promise<string> {
  // TODO: pass the options object in here
  // console.log(`Merging ${fileArray.length} files:`)
  // console.log(fileArray)
  return new Promise((resolve, reject) => {
    const sourceFile = fileArray[0]
    const themeFile = fileArray[1]
    const outputFile = fileArray[2]

    let newOutputFile = false
    if (!fs.existsSync(outputFile)) {
      fs.copyFileSync(sourceFile, outputFile)
      newOutputFile = true
    }

    fromFile(sourceFile).then((sourceDocument: SketchFile) => {
      fromFile(themeFile).then((themeDocument: SketchFile) => {
        fromFile(outputFile).then((outputDocument: SketchFile) => {
          if (newOutputFile) {
            outputDocument.contents.document.do_objectID =
              uuidv4().toUpperCase()
          }
          mergeDocuments(sourceDocument, themeDocument, outputDocument).then(
            (output) => {
              resolve(output)
            }
          )
        })
      })
    })
  })
}

function colorsAreEqual(
  colorOne: FileFormat.Color,
  colorTwo: FileFormat.Color
): boolean {
  return (
    colorOne.alpha === colorTwo.alpha &&
    colorOne.red === colorTwo.red &&
    colorOne.green === colorTwo.green &&
    colorOne.blue === colorTwo.blue
  )
}

function matchingSwatchForColorInSwatches(
  color: FileFormat.Color,
  swatches: FileFormat.SwatchContainer
): FileFormat.Swatch {
  // console.log(`Looking for a matching swatch for ${color}`)
  return swatches.objects.find((swatch) => {
    // console.log(JSON.stringify(swatch))
    //return colorsAreEqual(swatch.value, color)
    return swatch.do_objectID === color.swatchID
  })
}

function cleanupColorsInLayer(
  layer: any,
  swatches: FileFormat.SwatchContainer
) {
  if (
    layer._class == 'artboard' ||
    layer._class == 'symbolMaster' ||
    layer._class == 'group'
  ) {
    layer.layers.forEach((sublayer) => {
      sublayer = cleanupColorsInLayer(sublayer, swatches)
    })
  }
  // - Update fills & tints
  // TODO: not sure this is taking care of gradient fills...
  layer.style?.fills?.forEach((fill: FileFormat.Fill) => {
    if (fill.color.swatchID !== undefined) {
      // console.log(`Found a layer with a swatch fill: ${fill.color.swatchID}`)
      const matchingSwatch = matchingSwatchForColorInSwatches(
        fill.color,
        swatches
      )
      // console.log(
      //   `The color for that Swatch is: ${JSON.stringify(matchingSwatch.value)}`
      // )
      // console.log(`The color for the Layer is: ${JSON.stringify(fill.color)}`)
      if (layer.name == 'Default / Default') {
        console.log(`This one won't change its color`)
        console.log(layer.sharedStyleID)
        console.log(JSON.stringify(fill.color))
        console.log(JSON.stringify(matchingSwatch))
        //   console.log(`Found a matching swatch for ${layer.name} fill`)
        //   console.log(`\tBut are the colors equal?`)
        //   console.log(`\t${colorsAreEqual(matchingSwatch.value, fill.color)}`)
        //   console.log(`\t${JSON.stringify(matchingSwatch.value)}`)
        //   console.log(`\t${JSON.stringify(fill.color)}`)
      }
      if (matchingSwatch && !colorsAreEqual(fill.color, matchingSwatch.value)) {
        fill.color = {
          ...matchingSwatch.value,
          swatchID: matchingSwatch.do_objectID,
        }
      }
    }
  })

  // - Update borders
  layer.style?.borders?.forEach((border: FileFormat.Border) => {
    if (border.color.swatchID !== undefined) {
      const matchingSwatch = matchingSwatchForColorInSwatches(
        border.color,
        swatches
      )
      if (
        matchingSwatch &&
        !colorsAreEqual(border.color, matchingSwatch.value)
      ) {
        console.log(`Found a matching swatch for ${layer.name}'s border`)
        border.color = {
          ...matchingSwatch.value,
          swatchID: matchingSwatch.do_objectID,
        }
      }
    }
  })

  // - Update shadows
  layer.style?.shadows?.forEach((shadow: FileFormat.Shadow) => {
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

  // - Update innerShadows
  layer.style?.innerShadows?.forEach((shadow: FileFormat.InnerShadow) => {
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

  // - Update text colors
  layer.attributedString?.attributes?.forEach((attribute) => {
    const color = attribute.attributes.MSAttributedStringColorAttribute
    if (color && color.swatchID !== undefined) {
      const matchingSwatch = matchingSwatchForColorInSwatches(color, swatches)
      if (matchingSwatch && !colorsAreEqual(color, matchingSwatch.value)) {
        attribute.attributes.MSAttributedStringColorAttribute = {
          ...matchingSwatch.value,
          swatchID: matchingSwatch.do_objectID,
        }
      }
    }
  })

  // - Update Artboard and Slice backgrounds
  if (
    (layer._class === 'slice' || layer._class === 'artboard') &&
    layer.hasBackgroundColor
  ) {
    const backgroundColor = layer.backgroundColor
    const matchingSwatch = matchingSwatchForColorInSwatches(
      backgroundColor,
      swatches
    )
    if (matchingSwatch) {
      layer.backgroundColor = {
        ...matchingSwatch.value,
        swatchID: matchingSwatch.do_objectID,
      }
    }
  }

  return layer
}

function injectDynamicData(layer: any, data: object) {
  if (
    layer._class == 'artboard' ||
    layer._class == 'symbolMaster' ||
    layer._class == 'group'
  ) {
    layer.layers.forEach((sublayer) => {
      sublayer = injectDynamicData(sublayer, data)
    })
  }
  if (layer._class === 'text') {
    let text = layer.attributedString.string
    Object.keys(data).forEach((key) => {
      const match = `%%${key}%%`
      const replacement = text.replace(match, data[key])
      if (text.includes(match)) {
        layer.attributedString.string = replacement
        // TODO: fix this hack, because it only works for text layers with a single style
        layer.attributedString.attributes[0].length =
          layer.attributedString.string.length
        text = replacement
      }
    })
  }
  return layer
}

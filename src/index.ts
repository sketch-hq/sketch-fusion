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
      if (layer._class === 'text') {
        layer = injectDynamicData(layer, data)
      }
    })
  })
  // 6. Update text styles
  outputDocument.contents.document.layerStyles.objects.forEach((style) => {
    // console.log(`Updating Layer Style: ${style.name}`)
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
  })
  // 7. Update layer styles
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
      // Now we need to inject the binary assets into the output file
      // This is a workaroud for a bug in our file format tooling, that
      // we'll fix soon.

      // Make a temp folder inside our uploads folder
      // TODO: use the outputDocument.filepath to make this less brittle
      const tempFolder = path.resolve(__dirname, '../tmp/', uuidv4())
      fs.mkdirSync(tempFolder, { recursive: true })
      const sourceFolder = path.resolve(tempFolder, 'source')
      const outputFolder = path.resolve(tempFolder, 'output')
      // console.log(sourceFolder)
      // console.log(outputFolder)

      let needsToBeZipped = false
      const sourceZip = new AdmZip(sourceDocument.filepath)
      sourceZip.extractAllTo(sourceFolder, true)
      // is ☝️ async?
      // console.log('Source unzipped')

      const outputZip = new AdmZip(outputDocument.filepath)
      outputZip.extractAllTo(outputFolder, true)
      // is ☝️ async?
      // console.log('Output unzipped')

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
          // console.log(`File saved succesfully.`)
          fs.rmdirSync(tempFolder, { recursive: true })
          resolve(outputDocument.filepath)
        })
        archive.finalize()
        // is ☝️ async?
      } else {
        // console.log(`File saved succesfully.`)
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
  combinedStyles.objects = sourceStyles.objects
  themeStyles.objects.forEach((themeStyle: FileFormat.SharedStyle) => {
    const matchingStyle = combinedStyles.objects.find(
      (combinedStyle: FileFormat.SharedStyle) => {
        return combinedStyle.name === themeStyle.name
      }
    )
    if (matchingStyle) {
      if (options.reuseStyleID) {
        const originalStyle =
          combinedStyles.objects[combinedStyles.objects.indexOf(matchingStyle)]
        const originalID = originalStyle.do_objectID
        themeStyle.do_objectID = originalID
      }
      combinedStyles.objects[combinedStyles.objects.indexOf(matchingStyle)] =
        themeStyle
    } else {
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
  let foundSymbol = false
  document.contents.document.pages.forEach((page: FileFormat.Page) => {
    page.layers.forEach((layer: FileFormat.SymbolMaster) => {
      if (layer.name === symbol.name && layer._class === 'symbolMaster') {
        for (const property in symbol) {
          if (layer.hasOwnProperty(property)) {
            layer[property] = symbol[property]
          }
        }
        foundSymbol = true
      }
    })
  })

  if (!foundSymbol) {
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

    fromFile(sourceFile).then((sourceDocument: SketchFile) => {
      fromFile(themeFile).then((themeDocument: SketchFile) => {
        if (fs.existsSync(outputFile)) {
          // console.log(`File already exists, so let's read it: ${outputFile}`)
          fromFile(outputFile).then((document: SketchFile) => {
            mergeDocuments(sourceDocument, themeDocument, document).then(
              (output) => {
                resolve(output)
              }
            )
          })
        } else {
          const outputDocument: SketchFile = {
            filepath: outputFile,
            // Beware that this is not a clone, but a reference, and changes to the output document will also change the source document
            // It does not really matter though, as we are only using the output document for writing,
            // but this could be a problem in other cases
            contents: sourceDocument.contents,
            // contents: { ...sourceDocument.contents },
          }
          // The fact that we have to clone all this stuff here makes me incredibly nervous
          // TODO: see if we lose data if we don't copy all of these. In particular, the userInfo and workspace data is vital
          // outputDocument.contents.user = {
          //   ...sourceDocument.contents.user,
          // }
          // outputDocument.contents.meta = {
          //   ...sourceDocument.contents.meta,
          // }
          // outputDocument.contents.workspace = {
          //   ...sourceDocument.contents.workspace,
          // }
          // outputDocument.contents.document = {
          //   ...sourceDocument.contents.document,
          // }
          // outputDocument.contents.document.pages = {
          //   ...sourceDocument.contents.document.pages,
          // }

          // Use a new ID for the output document, otherwise Sketch will get confused
          // and think it's a duplicate of the source document. We're going to combine
          // the uuid of the source document with the uuid of the theme document, to get
          // a unique (but repeatable) ID for the output document.
          // Unsurprisingly, this doesn't work
          // const sourceUUID = sourceDocument.contents.document.do_objectID
          // const themeUUID = themeDocument.contents.document.do_objectID
          // const sourceUUIDBytes = uuidParse(sourceUUID)
          // const themeUUIDBytes = uuidParse(themeUUID)
          // let outputUUIDBytes = []
          // for (let i = 0; i < 8; i++) {
          //   outputUUIDBytes.push(sourceUUIDBytes[i])
          // }
          // for (let i = 0; i < 8; i++) {
          //   outputUUIDBytes.push(themeUUIDBytes[i])
          // }
          // outputDocument.contents.document.do_objectID = uuidStringify(outputUUIDBytes)
          // Meanwhile, we'll just use a random uuid and assume that if the ID is relevant,
          // they will upload an output file.
          console.log(
            `Original ID for source document: ${sourceDocument.contents.document.do_objectID}`
          )
          outputDocument.contents.document.do_objectID = uuidv4().toUpperCase()
          // console.log(
          //   sourceDocument.contents.document ===
          //     outputDocument.contents.document
          // )
          // console.log(
          //   `Original ID for output document: ${outputDocument.contents.document.do_objectID}`
          // )
          // outputDocument.contents.document.do_objectID = uuidv4().toUpperCase()
          // console.log(
          //   `New ID for source document: ${sourceDocument.contents.document.do_objectID}`
          // )
          console.log(
            `New ID for output document: ${outputDocument.contents.document.do_objectID}`
          )
          mergeDocuments(sourceDocument, themeDocument, outputDocument).then(
            (outputFile) => {
              resolve(outputFile)
            }
          )
        }
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
  return swatches.objects.find((swatch) => {
    //return colorsAreEqual(swatch.value, color)
    return swatch.do_objectID === color.swatchID
  })
}

function cleanupColorsInLayer(
  layer: any,
  swatches: FileFormat.SwatchContainer
) {
  // console.log(`Updating layer: ${layer.name}`)
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
      const matchingSwatch = matchingSwatchForColorInSwatches(
        fill.color,
        swatches
      )
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
  if (layer._class === 'text') {
    const attributes = layer.attributedString.attributes
    attributes.forEach((attribute) => {
      const color = attribute.attributes.MSAttributedStringColorAttribute
      if (color.swatchID !== undefined) {
        const matchingSwatch = matchingSwatchForColorInSwatches(color, swatches)
        if (matchingSwatch && !colorsAreEqual(color, matchingSwatch.value)) {
          attribute.attributes.MSAttributedStringColorAttribute = {
            ...matchingSwatch.value,
            swatchID: matchingSwatch.do_objectID,
          }
        }
      }
    })
  }

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

function injectDynamicData(layer: FileFormat.Text, data) {
  const text = layer.attributedString.string
  Object.keys(data).forEach((key) => {
    const match = `%%${key}%%`
    if (text.includes(match)) {
      const value = data[key]
      layer.attributedString.string = text.replace(match, value)
      // TODO: fix this hack, because it only works for text layers with a single style
      layer.attributedString.attributes[0].length =
        layer.attributedString.string.length
    }
  })
  return layer
}

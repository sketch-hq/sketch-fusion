import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { fromFile, toFile, SketchFile } from '@sketch-hq/sketch-file'
import { resolve } from 'path'
import * as fs from 'fs'
import archiver from 'archiver'
import AdmZip from 'adm-zip'
import uuid from 'uuid'

const options = require(resolve(__dirname, '../config.json'))

const sourceFile = resolve(__dirname, '../' + options.source)
const themeFile = resolve(__dirname, '../' + options.theme)
const outputFile = resolve(__dirname, '../' + options.output)

if (fs.existsSync(outputFile) && options.reuseOutput == false) {
  fs.unlinkSync(outputFile)
}

fromFile(sourceFile).then((sourceDocument: SketchFile) => {
  fromFile(themeFile).then((themeDocument: SketchFile) => {
    if (fs.existsSync(outputFile) && options.reuseOutput == true) {
      fromFile(outputFile).then((document: SketchFile) => {
        mergeDocuments(sourceDocument, themeDocument, document)
      })
    } else {
      const outputDocument: SketchFile = {
        filepath: outputFile,
        contents: sourceDocument.contents,
      }
      mergeDocuments(sourceDocument, themeDocument, outputDocument)
    }
  })
})

function mergeDocuments(
  sourceDocument: SketchFile,
  themeDocument: SketchFile,
  outputDocument: SketchFile
) {
  // 1. Merge Layer Styles
  outputDocument.contents.document.layerStyles = mergeStyles(
    sourceDocument.contents.document.layerStyles,
    themeDocument.contents.document.layerStyles,
    'sharedStyleContainer'
  )

  // 2. Merge Text Styles
  outputDocument.contents.document.layerTextStyles = mergeStyles(
    sourceDocument.contents.document.layerTextStyles,
    themeDocument.contents.document.layerTextStyles,
    'sharedTextStyleContainer'
  )

  // 3. Merge Colors
  outputDocument.contents.document.sharedSwatches = mergeColors(
    sourceDocument.contents.document.sharedSwatches,
    themeDocument.contents.document.sharedSwatches
  )

  // 4. Merge Symbols
  themeDocument.contents.document.pages.forEach((page: FileFormat.Page) => {
    page.layers.forEach((symbol: FileFormat.SymbolMaster) => {
      if (symbol._class === 'symbolMaster') {
        outputDocument = injectSymbol(symbol, outputDocument)
      }
    })
  })

  toFile(outputDocument).then(() => {
    // Now we need to inject the binary assets into the output file
    // This is a workaroud for a bug in our file format tooling, that
    // we'll fix soon.
    fs.rmdirSync(resolve(__dirname, '../tmp'), { recursive: true })

    const sourceZip = new AdmZip(sourceFile)
    sourceZip.extractAllTo(resolve(__dirname, '../tmp/source'), true)
    const outputZip = new AdmZip(outputFile)
    outputZip.extractAllTo(resolve(__dirname, '../tmp/output'), true)
    if (fs.existsSync(resolve(__dirname, '../tmp/source/fonts'))) {
      fs.renameSync(
        resolve(__dirname, '../tmp/source/fonts'),
        resolve(__dirname, '../tmp/output/fonts')
      )
    }
    if (fs.existsSync(resolve(__dirname, '../tmp/source/images'))) {
      fs.renameSync(
        resolve(__dirname, '../tmp/source/images'),
        resolve(__dirname, '../tmp/output/images')
      )
    }

    const output = fs.createWriteStream(outputFile)
    let archive = archiver('zip')
    archive.pipe(output)
    archive.directory(resolve(__dirname, '../tmp/output'), false)
    output.on('close', () => {
      fs.rmdirSync(resolve(__dirname, '../tmp'), { recursive: true })
      console.log(`File saved succesfully.`)
    })
    archive.finalize()
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
        do_objectID: uuid.v4(),
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

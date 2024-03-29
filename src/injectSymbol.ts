import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { SketchFile } from '@sketch-hq/sketch-file'
import { allSymbolMasters } from './allSymbolMasters'
import { allSymbolInstances } from './allSymbolInstances'
import { v4 as uuidv4 } from 'uuid'

export function injectSymbol(
  newSymbol: FileFormat.SymbolMaster,
  document: SketchFile,
  pageName: string = undefined
): SketchFile {
  const symbolPageName = pageName || 'Symbols'

  // console.log(`injectSymbol: ${newSymbol.name} on page ${symbolPageName}`)

  // Replace the existing symbol with the new one
  let foundSymbol = false
  const symbolMaster = allSymbolMasters(document).find((symbol) => {
    return symbol.name === newSymbol.name
  })
  if (symbolMaster) {
    // We will replace the existing symbol with the new one,
    // so we need to use the new symbol in all of the symbol instances
    allSymbolInstances(document).forEach((symbolInstance) => {
      if (symbolInstance.symbolID === symbolMaster.symbolID) {
        symbolInstance.symbolID = newSymbol.symbolID
      }
    })
    // Finally, update all prperties of the symbol master
    newSymbol.frame.x = symbolMaster.frame.x
    newSymbol.frame.y = symbolMaster.frame.y
    for (const property in symbolMaster) {
      if (symbolMaster.hasOwnProperty(property)) {
        symbolMaster[property] = newSymbol[property]
      }
    }
    foundSymbol = true
  }

  // If we didn't find the symbol, add it to the document
  if (!foundSymbol) {
    // console.log(`\tSymbol "${newSymbol.name}" is not in doc, adding`)
    let symbolPage: FileFormat.Page = document.contents.document.pages.find(
      (page) => {
        return page.name === symbolPageName
      }
    )
    if (!symbolPage) {
      // console.log(`\t\tCreating symbol page "${symbolPageName}"`)
      const newPage: FileFormat.Page = {
        name: symbolPageName,
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
        return page.name === symbolPageName
      })
    }

    console.log(
      `\t\tAdding symbol "${newSymbol.name}" to page "${symbolPage.name}"`
    )

    // TODO: ↓↓ Find a way to insert the symbol in the right position in the page
    // let maxX = -Infinity
    // let maxY = -Infinity
    // symbolPage.layers.forEach((layer: FileFormat.AnyLayer) => {
    //   maxX = Math.max(maxX, layer.frame.x + layer.frame.width)
    //   maxY = Math.max(maxY, layer.frame.y + layer.frame.height)
    // })
    // symbol.frame.x = maxX + 20
    // symbol.frame.y = maxY + 20
    symbolPage.layers.push(newSymbol)
  }
  return document
}

import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { SketchFile } from '@sketch-hq/sketch-file'
import { v4 as uuidv4 } from 'uuid'
import newOverrideName from './new-override-name'
import { allLayers } from './allLayers'

export function injectSymbol(
  newSymbol: FileFormat.SymbolMaster,
  document: SketchFile
): SketchFile {
  const symbolPageName = 'Symbols'
  let foundSymbol = false
  allLayers(document).forEach((existingSymbol) => {
    // We only want to replace Symbol Masters with the same name
    if (
      existingSymbol.name === newSymbol.name &&
      existingSymbol._class === 'symbolMaster'
    ) {
      const originalSymbolID = existingSymbol.symbolID
      // const originalObjectID = existingSymbol.do_objectID
      allLayers(document).forEach((layer) => {
        if (
          layer._class === 'symbolInstance' &&
          layer.symbolID === originalSymbolID
        ) {
          layer.symbolID = newSymbol.symbolID
        }

        // for all the instances of the symbol we're updating,
        // make sure their overrides now point to the layer IDs
        // of the new symbol
        // TODO: ↑↑ fix nested overrides
        layer.overrideValues?.forEach((overrideValue) => {
          overrideValue.overrideName = newOverrideName(
            overrideValue.overrideName,
            newSymbol,
            existingSymbol
          )
        })
      })

      for (const property in existingSymbol) {
        if (existingSymbol.hasOwnProperty(property)) {
          existingSymbol[property] = newSymbol[property]
        }
      }
      foundSymbol = true
    }
  })

  if (!foundSymbol) {
    console.log(`\tSymbol "${newSymbol.name}" is not in doc, adding`)
    let symbolPage: FileFormat.Page = document.contents.document.pages.find(
      (page) => {
        return page.name === symbolPageName
      }
    )
    if (!symbolPage) {
      console.log(`\t\tCreating symbol page "${symbolPageName}"`)
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

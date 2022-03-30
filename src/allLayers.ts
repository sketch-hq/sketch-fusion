import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'

export function allLayers(document: SketchFile) {
  const layers = []
  document.contents.document.pages.forEach((page) => {
    page.layers.forEach((layer) => {
      layers.push(sublayers(layer))
    })
  })
  return [].concat(...layers)
}

export function sublayers(
  layer:
    | FileFormat.Artboard
    | FileFormat.Group
    | FileFormat.Oval
    | FileFormat.Polygon
    | FileFormat.Rectangle
    | FileFormat.ShapePath
    | FileFormat.Star
    | FileFormat.Triangle
    | FileFormat.ShapeGroup
    | FileFormat.Text
    | FileFormat.SymbolMaster
    | FileFormat.SymbolInstance
    | FileFormat.Slice
    | FileFormat.Hotspot
    | FileFormat.Bitmap
): FileFormat.AnyLayer[] {
  if (layer === undefined) {
    console.log('layer is undefined')
  }
  try {
    const layers = []
    if (
      layer._class === 'group' ||
      layer._class === 'symbolMaster' ||
      layer._class === 'artboard'
    ) {
      layer.layers.forEach((sublayer) => {
        layers.push(sublayers(sublayer))
      })
    }
    layers.push(layer)
    return [].concat(...layers)
  } catch (error) {
    console.log(error)
  }
}

export function allTextLayers(document: SketchFile) {
  return allLayers(document).filter((layer) => layer._class === 'text')
}

export function allPages(document: SketchFile) {
  return document.contents.document.pages
}

export function allMergeableLayers(
  document: SketchFile
): FileFormat.AnyLayer[] {
  const mergeableLayers: FileFormat.AnyLayer[] = []
  allPages(document).forEach((page) => {
    const layers = page.layers
    layers.forEach((layer) => {
      if (layer._class !== 'symbolMaster') {
        mergeableLayers.push(layer)
      }
    })
  })
  return mergeableLayers
}

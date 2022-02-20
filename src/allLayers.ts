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

export function sublayers(layer): FileFormat.AnyLayer[] {
  const layers = []
  layers.push(layer)
  if (
    layer._class === 'group' ||
    layer._class === 'symbolMaster' ||
    layer._class === 'artboard'
  ) {
    layer.layers.forEach((sublayer) => {
      layers.push(sublayers(sublayer))
    })
  }
  return [].concat(...layers)
}

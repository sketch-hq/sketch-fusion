import { SketchFile } from '@sketch-hq/sketch-file'

export function allLayers(document: SketchFile) {
  const layers = []
  document.contents.document.pages.forEach((page) => {
    page.layers.forEach((layer) => {
      layers.push(layer)
      if (
        layer._class === 'group' ||
        layer._class === 'symbolMaster' ||
        layer._class === 'artboard'
      ) {
        layer.layers.forEach((sublayer) => {
          layers.push(sublayer)
        })
      }
    })
  })
  return layers
}

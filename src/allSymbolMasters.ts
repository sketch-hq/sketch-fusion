import { allLayers } from './allLayers'
import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'

export function allSymbolMasters(
  document: SketchFile
): FileFormat.SymbolMaster[] {
  return allLayers(document).filter((layer) => layer._class === 'symbolMaster')
}

export function allSymbolMastersWithPage(
  document: SketchFile
): { symbol: FileFormat.SymbolMaster; page: FileFormat.Page }[] {
  const ret = []
  document.contents.document.pages.forEach((page) => {
    page.layers.forEach((layer) => {
      if (layer._class === 'symbolMaster') {
        ret.push({ symbol: layer, page: page })
      }
    })
  })
  return ret
}

import { allLayers } from './allLayers'
import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'

export function allSymbolMasters(
  document: SketchFile
): FileFormat.SymbolMaster[] {
  const symbolMasters: FileFormat.SymbolMaster[] = []
  allLayers(document).forEach((layer: FileFormat.SymbolMaster) => {
    if (layer._class === 'symbolMaster') {
      symbolMasters.push(layer)
    }
  })
  return symbolMasters
}

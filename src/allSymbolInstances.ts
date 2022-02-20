import { allLayers } from './allLayers'
import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'

export function allSymbolInstances(
  document: SketchFile
): FileFormat.SymbolInstance[] {
  const symbolInstances = []
  allLayers(document).forEach((layer) => {
    if (layer._class === 'symbolInstance') {
      symbolInstances.push(layer)
    }
  })
  return symbolInstances
}

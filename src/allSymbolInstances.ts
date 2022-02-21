import { allLayers } from './allLayers'
import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'

export function allSymbolInstances(
  document: SketchFile
): FileFormat.SymbolInstance[] {
  return allLayers(document).filter(
    (layer) => layer._class === 'symbolInstance'
  )
}

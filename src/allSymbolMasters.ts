import { allLayers } from './allLayers'
import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'

export function allSymbolMasters(
  document: SketchFile
): FileFormat.SymbolMaster[] {
  return allLayers(document).filter((layer) => layer._class === 'symbolMaster')
}

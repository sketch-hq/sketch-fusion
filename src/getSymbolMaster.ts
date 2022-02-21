import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { allSymbolMasters } from './allSymbolMasters'

export function getSymbolMaster(
  symbolInstance: FileFormat.SymbolInstance,
  document: SketchFile
): FileFormat.SymbolMaster {
  const documentMasters = allSymbolMasters(document)
  let symbolMasterForInstance: FileFormat.SymbolMaster
  documentMasters.forEach((symbolMaster) => {
    if (symbolMaster.symbolID == symbolInstance.symbolID) {
      symbolMasterForInstance = symbolMaster
    }
  })
  return symbolMasterForInstance
}

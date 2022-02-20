import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { allSymbolMasters } from './allSymbolMasters'

export function getSymbolMaster(
  symbolInstance: FileFormat.SymbolInstance,
  document: SketchFile
): FileFormat.SymbolMaster {
  // console.log(`getSymbolMaster(${symbolInstance.name})`)

  let symbolMasterForInstance
  allSymbolMasters(document).forEach((symbolMaster) => {
    // console.log(`Instance: ${symbolInstance.symbolID}`)
    // console.log(`Master:   ${symbolMaster.symbolID}`)
    if (symbolMaster.symbolID == symbolInstance.symbolID) {
      symbolMasterForInstance = symbolMaster
    }
  })
  return symbolMasterForInstance
}

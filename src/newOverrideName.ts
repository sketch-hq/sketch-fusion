import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { sublayers } from './allLayers'

export default function newOverrideName(
  oldOverrideName: string,
  newSymbol: FileFormat.SymbolMaster,
  oldSymbol: FileFormat.SymbolMaster
): string {
  console.log(
    `newOverrideName(${oldOverrideName}, ${newSymbol.name}, ${oldSymbol.name})`
  )

  const oldLayerID = oldOverrideName.split('_')[0]
  const oldLayerType = oldOverrideName.split('_')[1]

  const oldLayerName = sublayers(oldSymbol).filter(
    (layer) => layer.do_objectID === oldLayerID
  )[0]?.name
  // console.log(`oldLayerName: ${oldLayerName}`)

  // This does not support nested layers, right?
  // console.log(`We are looking for a layer to replace ${oldOverrideName}.`)
  // console.log(`These are the layers on this Symbol:`)
  // console.log(newSymbol.layers.map((layer) => layer.name))

  const newLayerID = sublayers(newSymbol).filter(
    (layer) => layer.name === oldLayerName
  )[0]?.do_objectID
  // console.log(`newLayerID: ${newLayerID}`)

  if (!newLayerID) {
    return oldOverrideName
  } else {
    return newLayerID + '_' + oldLayerType
  }
}

import FileFormat from '@sketch-hq/sketch-file-format-ts'

export default function (
  oldOverrideName: string,
  newSymbol: FileFormat.SymbolMaster,
  oldSymbol: FileFormat.SymbolMaster
): string {
  // console.log(
  //   `newOverrideName(${oldOverrideName}, ${newSymbol.name}, ${oldSymbol.name})`
  // )

  const oldLayerID = oldOverrideName.split('_')[0]
  const oldLayerType = oldOverrideName.split('_')[1]
  const oldLayerName = oldSymbol.layers.filter(
    (layer) => layer.do_objectID === oldLayerID
  )[0]?.name
  // console.log(`oldLayerName: ${oldLayerName}`)

  const newLayerID = newSymbol.layers.filter(
    (layer) => layer.name === oldLayerName
  )[0]?.do_objectID
  // console.log(`newLayerID: ${newLayerID}`)

  if (!newLayerID) {
    return oldOverrideName
  } else {
    return newLayerID + '_' + oldLayerType
  }
}

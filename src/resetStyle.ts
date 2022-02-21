import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { matchingLayerStyle } from './matchingLayerStyle'

export function resetStyle(layer, styles: FileFormat.SharedStyle[]) {
  if (
    layer._class === 'symbolMaster' ||
    layer._class === 'artboard' ||
    layer._class === 'group'
  ) {
    layer.layers.forEach((sublayer) => {
      sublayer = resetStyle(sublayer, styles)
    })
  }
  if (layer.sharedStyleID) {
    const matchingStyle = matchingLayerStyle(layer.sharedStyleID, styles)
    // console.log(matchingStyle)
    if (matchingStyle) {
      Object.keys(matchingStyle.value).forEach((key) => {
        if (key != 'do_objectID') {
          layer.style[key] = matchingStyle.value[key]
        }
        layer.style.do_objectID = matchingStyle.do_objectID
      })
      layer.sharedStyleID = matchingStyle.do_objectID
    }
  }
  return layer
}

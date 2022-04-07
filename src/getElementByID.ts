import { SketchFile } from '@sketch-hq/sketch-file'
import { allLayers } from './allLayers'

export function getElementByID(id: string, document: SketchFile) {
  const layers = allLayers(document)
  return layers.filter((layer) => layer.do_objectID === id)[0]
}

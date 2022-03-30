import { SketchFile } from '@sketch-hq/sketch-file'
import { allLayers } from './allLayers'

export default function getElementByName(name: string, document: SketchFile) {
  const layers = allLayers(document)
  return layers.find((layer) => layer.name === name)
}

export function getElementsByName(name: string, document: SketchFile) {
  const layers = allLayers(document)
  return layers.filter((layer) => layer.name === name)
}

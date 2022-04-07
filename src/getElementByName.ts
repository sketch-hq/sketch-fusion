import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { allLayers } from './allLayers'

export function getElementByName(
  name: string,
  document: SketchFile
): FileFormat.AnyLayer {
  const layers = allLayers(document)
  return layers.find((layer) => layer.name === name)
}

export function getElementsByName(
  name: string,
  document: SketchFile
): FileFormat.AnyLayer[] {
  const layers = allLayers(document)
  return layers.filter((layer) => layer.name === name)
}

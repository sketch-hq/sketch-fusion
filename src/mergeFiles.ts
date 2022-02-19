import { fromFile, SketchFile } from '@sketch-hq/sketch-file'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { mergeDocuments } from './mergeDocuments'

export async function mergeFiles(fileArray: string[]): Promise<string> {
  // TODO: ↓↓ pass the options object in here
  // console.log(`Merging ${fileArray.length} files:`)
  // console.log(fileArray)
  return new Promise((resolve, reject) => {
    const sourceFile = fileArray[0]
    const themeFile = fileArray[1]
    const outputFile = fileArray[2]

    let newOutputFile = false
    if (!fs.existsSync(outputFile)) {
      fs.copyFileSync(sourceFile, outputFile)
      newOutputFile = true
    }

    fromFile(sourceFile).then((sourceDocument: SketchFile) => {
      fromFile(themeFile).then((themeDocument: SketchFile) => {
        fromFile(outputFile).then((outputDocument: SketchFile) => {
          if (newOutputFile) {
            outputDocument.contents.document.do_objectID =
              uuidv4().toUpperCase()
          }
          mergeDocuments(sourceDocument, themeDocument, outputDocument).then(
            (output) => {
              resolve(output)
            }
          )
        })
      })
    })
  })
}

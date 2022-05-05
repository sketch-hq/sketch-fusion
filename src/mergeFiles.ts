import { fromFile, SketchFile } from '@sketch-hq/sketch-file'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { mergeDocuments } from './mergeDocuments'

export async function mergeFiles(fileArray: string[]): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const sourceFile = fileArray[0]
    const themeFile = fileArray[1]
    const outputFile = fileArray[2]

    const outputData = {
      id: uuidv4().toUpperCase(),
      fileName: outputFile,
      cloudShare: {},
      documentState: {},
    }

    if (fs.existsSync(outputFile)) {
      await fromFile(outputFile).then((file: SketchFile) => {
        outputData.id = file.contents.document.do_objectID
        if (file.contents.user.document?.cloudShare) {
          outputData.cloudShare = JSON.parse(
            JSON.stringify(file.contents.user.document?.cloudShare)
          )
        }
        if (file.contents.document.documentState) {
          outputData.documentState = JSON.parse(
            JSON.stringify(file.contents.document.documentState)
          )
        }
      })
    }
    console.log('Output file data: ', outputData)

    fromFile(sourceFile).then((sourceDocument: SketchFile) => {
      fromFile(themeFile).then((themeDocument: SketchFile) => {
        mergeDocuments(sourceDocument, themeDocument, outputData).then(
          (output) => {
            resolve(output)
          }
        )
      })
    })
  })
}

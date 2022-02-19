import path from 'path'
import { mergeFiles } from './src/mergeFiles'

const sourceFile = path.resolve(__dirname, process.argv.slice(2)[0])
const themeFile = path.resolve(__dirname, process.argv.slice(2)[1])
const outputFile =
  process.argv.slice(2)[2] !== undefined
    ? path.resolve(__dirname, process.argv.slice(2)[2])
    : path.resolve(__dirname, `output-${Date.now()}.sketch`)

mergeFiles([sourceFile, themeFile, outputFile]).then((result) => {
  console.log(result)
})

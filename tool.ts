import path from 'path'
import { mergeFiles } from './src/mergeFiles'

const sourceFile = path.resolve(__dirname, process.argv[2])
const themeFile = path.resolve(__dirname, process.argv[3])
const outputFile =
  process.argv[4] !== undefined
    ? path.resolve(__dirname, process.argv[4])
    : path.resolve(__dirname, `output-${Date.now()}.sketch`)

mergeFiles([sourceFile, themeFile, outputFile]).then((result) => {
  console.log(`\n\n💎 File saved at: ${result}`)
})

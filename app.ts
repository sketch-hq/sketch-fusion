import path from 'path'
import express from 'express'
import fileUpload from 'express-fileupload'
import { mergeFiles } from './src/index.js'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'

const app = express()
const port = process.env.PORT || 3000

app.use(
  fileUpload({
    uploadTimeout: 0,
  })
)
app.use(express.static(path.resolve(__dirname, 'public')))
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
})

// const options = require(path.resolve(__dirname, 'config.json'))

app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length < 2) {
    // TODO: Proper error checking. We need to make sure we have all the files we need,
    // not just the first two.
    res.status(400).send('You need to upload at least 2 files.')
    return
  } else {
    // Make a folder to store all the files we'll use
    const fuseFolder = path.resolve(__dirname, 'uploads', uuidv4())
    fs.mkdirSync(fuseFolder, { recursive: true })

    const filesToMerge = []
    req.files.sourceFile.mv(
      path.resolve(fuseFolder, req.files.sourceFile.name),
      (err) => {
        if (err) {
          console.error(err)
          res.status(500).send('Error moving source file.')
          return
        }

        filesToMerge.push(path.resolve(fuseFolder, req.files.sourceFile.name))
        req.files.themeFile.mv(
          path.resolve(fuseFolder, req.files.themeFile.name),
          (err) => {
            if (err) {
              console.error(err)
              res.status(500).send('Error moving theme file.')
              return
            }
            filesToMerge.push(
              path.resolve(fuseFolder, req.files.themeFile.name)
            )
            if (req.files.outputFile) {
              req.files.outputFile.mv(
                path.resolve(fuseFolder, req.files.outputFile.name),
                (err) => {
                  if (err) {
                    console.error(err)
                    res.status(500).send('Error moving output file.')
                    return
                  }
                  console.log(`Output file provided, so let's use it`)

                  filesToMerge.push(
                    path.resolve(fuseFolder, req.files.outputFile.name)
                  )
                  mergeFiles(filesToMerge).then((filepath) => {
                    console.log(`Starting download`)
                    res.download(filepath)
                  })
                }
              )
            } else {
              console.log(
                `No output file provided, so we'll just merge the files.`
              )
              filesToMerge.push(path.resolve(fuseFolder, 'output.sketch'))
              mergeFiles(filesToMerge).then((filepath) => {
                console.log(`Starting download`)
                res.download(filepath)
              })
            }
          }
        )
      }
    )
  }
})
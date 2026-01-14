import express from 'express'
import cors from 'cors'

import rootRouter from './routes/root.js'

import { PORT } from './config.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/api', rootRouter)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
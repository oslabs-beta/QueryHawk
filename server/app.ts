import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { ServerError } from '../types/types.ts';
import apiRouter from './routes/api';
import testTracesRouter from './routes/test-traces';

const app = express();

//middleware
app.use(
  cors({
    origin: 'http://localhost:5173', // Your frontend's URL
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type'],
    // credentials: true, // Allow cookies and credentials
  })
);
app.use(express.json());

//routes
app.use('/debug', testTracesRouter);
//api routes
apiRouter.get('/', (req, res) => {
  res.status(200).json({ message: 'API is working!' });
});
app.use('/api', apiRouter);
//error handler
const errorHandler: ErrorRequestHandler = (
  err: ServerError,
  _req,
  res,
  _next
) => {
  const defaultErr: ServerError = {
    log: 'Express error handler caught unknown middleware error',
    status: 500,
    message: { err: 'An error occurred' },
  };
  const errorObj: ServerError = { ...defaultErr, ...err };
  console.log(errorObj.log);
  res.status(errorObj.status).json(errorObj.message);
};

app.use(errorHandler);
export default app;

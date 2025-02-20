import express, { ErrorRequestHandler, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { ServerError } from '../types/types.ts';
import apiRoutes from './routes/apiRoutes.ts';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173', // Your frontend's URL
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type'],
    // credentials: true, // Allow cookies and credentials
  })
);
app.use(express.json());

app.use('/api', apiRoutes);

app.use('/', (req, res) => {
  res.status(200).json({ message: 'API is working!' });
});

app.use('*', (req: Request, res: Response) => {
  res.status(404).send('Endpoint does not exist.');
});

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

  if (!res.headersSent) {
    res.status(errorObj.status).json(errorObj.message);
  } else {
    // If headers have already been sent, log the error but don't send a new response
    console.error('Error response attempt after headers sent:', errorObj);
  }
  // res.status(errorObj.status).json(errorObj.message);
};

app.use(errorHandler);

export default app;

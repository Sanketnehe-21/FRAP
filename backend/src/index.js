import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import familiesRouter from './routes/families.js';
import transactionsRouter from './routes/transactions.js';
import accountsRouter from './routes/accounts.js';
import goalsRouter from './routes/goals.js';
import documentsRouter from './routes/documents.js';
import learningRouter from './routes/learning.js';
import merchantRouter from './routes/merchant.js';

const app = express();

app.use(cors());
app.use(express.json());

// Mount health checks (includes root GET /health and GET /actuator/health)
app.use('/', healthRouter);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/families', familiesRouter);
app.use('/api/v1/families/:familyId/transactions', transactionsRouter);
app.use('/api/v1/families/:familyId/accounts', accountsRouter);
app.use('/api/v1/families/:familyId/goals', goalsRouter);
app.use('/api/v1/families/:familyId/documents', documentsRouter);
app.use('/api/v1', learningRouter);
app.use('/api/v1/merchant-registry', merchantRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`FRAP backend running on http://localhost:${config.port}`);
});
export default app;

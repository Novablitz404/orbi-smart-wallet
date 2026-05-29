import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { startFlushWorker } from './worker/flush';
import quoteRouter from './api/routes/quote';
import bundleRouter from './api/routes/bundle';
import statusRouter from './api/routes/status';
import accountRouter from './api/routes/account';
import recoveryRouter from './api/routes/recovery';
import walletRouter from './api/routes/wallet';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/v1/quote', quoteRouter);
app.use('/v1/bundle', bundleRouter);
app.use('/v1/status', statusRouter);
app.use('/v1/account', accountRouter);
app.use('/v1/recovery', recoveryRouter);
app.use('/v1/wallet', walletRouter);

app.get('/health', (_req: express.Request, res: express.Response) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[relay] Listening on port ${PORT}`);
  startFlushWorker();
});

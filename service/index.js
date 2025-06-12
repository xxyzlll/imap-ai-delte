import express from 'express';
import mailRouter from './api/mail.js';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/', mailRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

/* Backend server with express */
import express from 'express';
import router from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

app.use(router);
app.use(express.json());
app.use(express.urlencoded());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

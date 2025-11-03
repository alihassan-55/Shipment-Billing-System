import app from './app.js';

const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on ${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Network access: http://[YOUR_IP]:${port}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('Serving client application from /');
    console.log('API endpoints available at /api');
  }
});


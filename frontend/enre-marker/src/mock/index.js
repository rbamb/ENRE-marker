const express = require('express');
const mock = express();
const port = 3000;

mock.post('/api/v1/user/login', (req, res) => {
  res.send('hello world from express');
});

mock.listen(port, () => {
  console.log(`Mock server started at http://localhost:${port}`);
});

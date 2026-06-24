require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pushStats } = require('../lib/statsSync');

pushStats()
  .then(() => {
    console.log('Stats pushed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to push stats:', err.message);
    process.exit(1);
  });
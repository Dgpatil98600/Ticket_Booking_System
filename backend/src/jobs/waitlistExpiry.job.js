
import cron from 'node-cron';
import { processExpiredOffers } from '../services/waitlist.service.js';

const startWaitlistExpiryCleanup = () => {
  cron.schedule('*/2 * * * *', async () => {
    try {
      const processed = await processExpiredOffers();
      if (processed > 0) {
        console.log(`✅ Processed ${processed} expired waitlist offer(s)`);
      }
    } catch (error) {
      console.error('❌ Waitlist expiry cron error:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  console.log(' Waitlist expiry cron job started (runs every 2 minutes)');
};

export { startWaitlistExpiryCleanup };

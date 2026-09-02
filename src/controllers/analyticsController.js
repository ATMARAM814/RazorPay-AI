import { supabase } from '../config/supabase.js';

// GET /api/analytics/comparison — Compares our recovery engine vs naive baseline
export const getComparison = async (req, res) => {
  try {
    const [recoveryRes, naiveRes] = await Promise.all([
      supabase.from('recovery_actions').select('outcome').limit(10000),
      supabase.from('naive_baseline_actions').select('outcome').limit(10000)
    ]);

    if (recoveryRes.error) {
      return res.status(500).json({ error: `Recovery actions error: ${recoveryRes.error.message}` });
    }
    if (naiveRes.error) {
      return res.status(500).json({ error: `Naive baseline actions error: ${naiveRes.error.message}` });
    }

    const recoveryData = recoveryRes.data || [];
    const naiveData = naiveRes.data || [];

    // Compute our system stats
    const ourTotal = recoveryData.length;
    const ourRecovered = recoveryData.filter(item => item.outcome === 'recovered').length;
    const ourRatePct = ourTotal > 0 ? parseFloat(((ourRecovered / ourTotal) * 100).toFixed(2)) : 0;

    // Compute naive baseline stats
    const naiveTotal = naiveData.length;
    const naiveRecovered = naiveData.filter(item => item.outcome === 'recovered').length;
    const naiveRatePct = naiveTotal > 0 ? parseFloat(((naiveRecovered / naiveTotal) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      our_system: {
        recovered: ourRecovered,
        total: ourTotal,
        recovery_rate_pct: ourRatePct
      },
      naive_baseline: {
        recovered: naiveRecovered,
        total: naiveTotal,
        recovery_rate_pct: naiveRatePct
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// GET /api/analytics/breakdown — Grouped recovery rate by predicted_category and action_taken
export const getBreakdown = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recovery_actions')
      .select('predicted_category, action_taken, outcome')
      .limit(10000);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const map = new Map();

    for (const row of data || []) {
      const category = row.predicted_category || 'unknown';
      const action = row.action_taken || 'unknown';
      const key = `${category}:::${action}`;

      if (!map.has(key)) {
        map.set(key, {
          predicted_category: category,
          action_taken: action,
          total: 0,
          recovered: 0
        });
      }

      const item = map.get(key);
      item.total += 1;
      if (row.outcome === 'recovered') {
        item.recovered += 1;
      }
    }

    const breakdown = Array.from(map.values()).map(item => ({
      predicted_category: item.predicted_category,
      action_taken: item.action_taken,
      total: item.total,
      recovered: item.recovered,
      recovery_rate_pct: item.total > 0 ? parseFloat(((item.recovered / item.total) * 100).toFixed(2)) : 0
    }));

    return res.status(200).json({ data: breakdown });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

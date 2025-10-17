// Simple Vercel serverless function for health checks
module.exports = (req, res) => {
  res.status(200).json({ status: 'ok', source: 'vercel api/health' })
}

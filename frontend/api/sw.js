export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const content = `self.options = {
    "domain": "5gvci.com",
    "zoneId": 11839605
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')`;

  return res.status(200).send(content);
}

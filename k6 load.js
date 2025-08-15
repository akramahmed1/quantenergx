import http from 'k6/http';
import { sleep } from 'k6';
export let options = { vus: 10000, duration: '1m' };
export default function () {
  http.get('http://localhost:3001/health');
  sleep(0.01);
}

# Run the scraper (and optionally SEO jobs) on an Oracle Cloud Always Free VM

Stack on the VM: **Docker Compose** → `redis` (job queue) + `scraper` (Playwright/Chromium)
+ optional `seo-jobs` + `caddy` (automatic free HTTPS). The Vercel app calls the scraper over HTTPS.

```
Vercel app ──HTTPS──▶ Caddy ──▶ scraper ──▶ Redis (Bull queue)
                              └▶ seo-jobs (optional profile)
scraper ──HTTPS callback──▶ Vercel  /api/admin/scraper/jobs/<id>/{progress,results}
```

## 1. Create the Oracle account
1. Sign up at <https://www.oracle.com/cloud/free/> (a card is needed for verification only).
2. Pick a **home region** carefully; it can't be changed. Choose one close to you (e.g. Mumbai / Hyderabad).

## 2. Create the VM
1. Console → **Compute → Instances → Create instance**.
2. **Image:** Canonical Ubuntu 22.04 (or 24.04).
3. **Shape:** *Ampere* → `VM.Standard.A1.Flex` with **2 OCPU / 12 GB RAM** (the Always Free allowance is 4 OCPU / 24 GB total).
   - Don't use the tiny AMD `E2.1.Micro` (1 GB RAM): Chromium will crash.
   - If you get "Out of capacity", retry later or in another availability domain.
4. **Networking:** keep the default VCN/subnet and make sure **Assign a public IPv4 address** is on.
5. **SSH keys:** on your computer run `ssh-keygen -t ed25519 -f ~/.ssh/oracle_bmf`, then upload/paste `~/.ssh/oracle_bmf.pub`.
6. **Boot volume:** 50 GB is fine. Click **Create** and note the **public IP** (e.g. `129.146.10.5`).

## 3. Open ports 80 and 443 (two places)
**a) Oracle network rule:** Instance page → *Subnet* → *Security List* → **Add ingress rules**:
Source CIDR `0.0.0.0/0`, protocol TCP, destination port `80`; add a second rule for `443`.

**b) VM firewall** (Oracle's Ubuntu images ship with restrictive iptables):
```bash
ssh -i ~/.ssh/oracle_bmf ubuntu@<PUBLIC_IP>
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80  -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo apt-get update && sudo apt-get install -y iptables-persistent   # answer Yes to save rules
sudo netfilter-persistent save
```

## 4. Install Docker
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit    # log out and SSH back in so the group applies
docker --version && docker compose version
```

## 5. Get the code
```bash
git clone https://github.com/rayyanansari17/BookmyFarmhouse.git
cd BookmyFarmhouse
# Until this work is merged to main, use the branch that contains deploy/oracle:
git checkout claude/eloquent-mendel-hyjmiv
```
If the repo is private, create a GitHub *fine-grained personal access token* with read-only **Contents**
access to this repo and use `https://<TOKEN>@github.com/rayyanansari17/BookmyFarmhouse.git` as the URL.

## 6. Configure secrets
```bash
cd deploy/oracle
cp .env.example .env
nano .env
```
- `SCRAPER_HOST` / `SEO_HOST`: your IP with dots → dashes on `sslip.io`, e.g. IP `129.146.10.5` →
  `scraper.129-146-10-5.sslip.io` and `seo.129-146-10-5.sslip.io` (free DNS, no domain purchase needed).
- `REDIS_PASSWORD`: `openssl rand -hex 24`
- `SCRAPER_SECRET`: **must be identical** to `SCRAPER_SECRET` in the Vercel project env.
- Only if you also run SEO jobs here: `SEO_JOB_SECRET` (same as Vercel), `MONGODB_URI`, and the Google variables.

## 7. Start it
From the **repo root** (`~/BookmyFarmhouse`):
```bash
# scraper only
docker compose -f deploy/oracle/docker-compose.yml --env-file deploy/oracle/.env up -d --build redis scraper caddy
# scraper + SEO jobs
docker compose -f deploy/oracle/docker-compose.yml --env-file deploy/oracle/.env --profile seo up -d --build
```
The first build takes several minutes (it downloads Chromium and its system libraries).
```bash
docker compose -f deploy/oracle/docker-compose.yml ps
docker compose -f deploy/oracle/docker-compose.yml logs -f scraper
```
You should see `BMF Scraper service running on port 3001`.

## 8. Check it from outside
```bash
curl https://scraper.<IP-WITH-DASHES>.sslip.io/health
# {"status":"ok","service":"bmf-scraper"}
curl -i -X POST https://scraper.<IP-WITH-DASHES>.sslip.io/jobs     # must be 403 (no secret)
```
The first HTTPS request may take ~30 s while Caddy fetches the certificate.

## 9. Point Vercel at it
In Vercel → Project → Settings → Environment Variables (Production + Preview):
- `SCRAPER_SERVICE_URL` = `https://scraper.<IP-WITH-DASHES>.sslip.io`
- `SCRAPER_SECRET` = same value as in the VM's `.env`
- If SEO jobs run on the VM too: `SEO_JOB_SERVICE_URL` = `https://seo.<IP-WITH-DASHES>.sslip.io`

Then **redeploy** the Vercel project so the variables apply.

## 10. End-to-end test
1. Log in at `/admin/login` → Scraper → create a job (e.g. "farmhouse", city "Pune", limit 5).
2. Watch `docker compose ... logs -f scraper`; the job's progress should update in the admin UI and results should
   appear as scraped listings.

## Operations
| Task | Command (from repo root) |
|---|---|
| Update after a git push | `git pull && docker compose -f deploy/oracle/docker-compose.yml --env-file deploy/oracle/.env up -d --build` |
| Logs | `docker compose -f deploy/oracle/docker-compose.yml logs -f --tail=100 scraper` |
| Restart | `docker compose -f deploy/oracle/docker-compose.yml restart scraper` |
| Stop everything | `docker compose -f deploy/oracle/docker-compose.yml down` |

## Gotchas
- **Idle reclamation:** Oracle may reclaim Always Free instances that stay very idle for ~7 days. Upgrading the
  account to *Pay As You Go* keeps the free resources free and removes that risk.
- **Back up** `deploy/oracle/.env`; it is git-ignored on purpose.
- Scraping Google Maps from a datacenter IP can be rate-limited or blocked; if jobs return nothing, check the logs first.

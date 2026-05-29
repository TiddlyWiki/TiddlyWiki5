# TiddlyWiki — Docker & Kubernetes

A production-ready container image and Helm chart for running TiddlyWiki5 on Kubernetes.

- **Docker Hub:** `mibmal/tiddlywiki` — [hub.docker.com/r/mibmal/tiddlywiki](https://hub.docker.com/r/mibmal/tiddlywiki)
- **Helm chart:** `https://mibmal.github.io/TiddlyWiki5`
- **OCI chart:** `oci://registry-1.docker.io/mibmal/charts/tiddlywiki`

---

## Quick start — Docker

```bash
# Run the bundled demo wiki (no data volume needed)
docker run --rm -p 8080:8080 mibmal/tiddlywiki
# → http://localhost:8080

# Run with a persistent wiki (data survives container restarts)
docker run -d \
  --name tiddlywiki \
  -p 8080:8080 \
  -v tiddlywiki-data:/data/wiki \
  mibmal/tiddlywiki \
  /data/wiki --listen host=0.0.0.0 port=8080
```

The image is built with `gcr.io/distroless/nodejs22-debian12` — no shell, no package manager, runs as non-root (uid 65532).

---

## Quick start — Helm

### Install

```bash
helm repo add mibmal https://mibmal.github.io/TiddlyWiki5
helm repo update

helm install tiddlywiki mibmal/tiddlywiki \
  --namespace tiddlywiki \
  --create-namespace
```

Or via OCI (no `helm repo add` needed):

```bash
helm install tiddlywiki \
  oci://registry-1.docker.io/mibmal/charts/tiddlywiki \
  --namespace tiddlywiki \
  --create-namespace
```

### Expose with an Ingress

```bash
helm upgrade --install tiddlywiki mibmal/tiddlywiki \
  --namespace tiddlywiki --create-namespace \
  --set ingress.enabled=true \
  --set "ingress.hosts[0].host=wiki.example.com" \
  --set "ingress.tls[0].secretName=tiddlywiki-tls" \
  --set "ingress.tls[0].hosts[0]=wiki.example.com" \
  --set "ingress.annotations.cert-manager\.io/cluster-issuer=letsencrypt-prod"
```

### Uninstall

```bash
helm uninstall tiddlywiki -n tiddlywiki
# Note: the PVC is kept by default (helm.sh/resource-policy: keep).
# Delete manually if you want to remove all data:
kubectl delete pvc tiddlywiki-data -n tiddlywiki
```

---

## Configuration reference

All options are in [helm/tiddlywiki/values.yaml](helm/tiddlywiki/values.yaml). Key sections:

### Wiki settings

| Value | Default | Description |
|---|---|---|
| `wiki.dataPath` | `/data/wiki` | Path served by TiddlyWiki. Use `/app/editions/server` for the bundled demo. |
| `wiki.port` | `8080` | Container port |
| `wiki.pathPrefix` | `""` | Host under a sub-path, e.g. `/wiki` |
| `wiki.gzip` | `true` | Gzip response compression |
| `wiki.browserCache` | `true` | ETag-based browser caching |

### Authentication

TiddlyWiki supports three auth modes — pick one:

**1. No auth (public wiki)**

```yaml
auth:
  enabled: false
```

**2. Single username / password**

```yaml
auth:
  enabled: true
  username: admin
  password: changeme
  readers: "(authenticated)"
  writers: "(authenticated)"
```

**3. Multi-user credentials CSV**

```bash
# Create a credentials.csv file:
cat > credentials.csv <<EOF
username,password
alice,s3cr3t
bob,p4ssw0rd
EOF

kubectl create secret generic wiki-credentials \
  --from-file=credentials.csv=./credentials.csv \
  -n tiddlywiki
```

```yaml
auth:
  enabled: true
  credentialsSecret: wiki-credentials
  readers: "alice,bob"
  writers: "alice"
```

**4. SSO via oauth2-proxy** — see [SSO section](#sso-via-oauth2-proxy) below.

### Persistence

```yaml
persistence:
  enabled: true
  size: 1Gi
  storageClass: ""          # leave empty for cluster default
  accessMode: ReadWriteOnce
```

To use an existing PVC:

```yaml
persistence:
  existingClaim: my-existing-pvc
```

### Resources

```yaml
resources:
  requests:
    memory: 128Mi
    cpu: 100m
  limits:
    memory: 256Mi
    cpu: 500m
nodeHeapMb: 192    # Node.js V8 heap cap — keep at ~75% of memory limit
```

---

## SSO via oauth2-proxy

oauth2-proxy handles the OAuth2/OIDC flow, then forwards requests to TiddlyWiki with `X-Auth-Request-User` set to the logged-in user's identity. TiddlyWiki reads that header and treats the user as authenticated — no passwords stored in Kubernetes.

**Supported providers:** GitHub, Google, Azure AD, Okta, GitLab, and any OIDC-compatible IdP.

### GitHub SSO example

1. Create a GitHub OAuth App at <https://github.com/settings/applications/new>
   - Homepage URL: `https://wiki.example.com`
   - Callback URL: `https://wiki.example.com/oauth2/callback`

2. Create the secret:

```bash
kubectl create secret generic wiki-oauth2 \
  --from-literal=client-id=YOUR_GITHUB_CLIENT_ID \
  --from-literal=client-secret=YOUR_GITHUB_CLIENT_SECRET \
  --from-literal=cookie-secret=$(openssl rand -base64 32) \
  -n tiddlywiki
```

3. Install the chart:

```bash
helm upgrade --install tiddlywiki mibmal/tiddlywiki \
  --namespace tiddlywiki --create-namespace \
  --set oauth2Proxy.enabled=true \
  --set oauth2Proxy.provider=github \
  --set oauth2Proxy.existingSecret=wiki-oauth2 \
  --set oauth2Proxy.emailDomain="*" \
  --set auth.enabled=true \
  --set auth.readers="(authenticated)" \
  --set auth.writers="(authenticated)" \
  --set ingress.enabled=true \
  --set "ingress.hosts[0].host=wiki.example.com" \
  --set "ingress.tls[0].secretName=tiddlywiki-tls" \
  --set "ingress.tls[0].hosts[0]=wiki.example.com"
```

When `oauth2Proxy.enabled=true`, the Service and Ingress automatically target the proxy port (4180) instead of TiddlyWiki's port (8080). The proxy sits in front and only passes authenticated requests through.

### Restrict to a GitHub org/team

```yaml
oauth2Proxy:
  enabled: true
  provider: github
  githubOrg: my-org
  githubTeam: my-org/wiki-users
  existingSecret: wiki-oauth2
```

### Google OIDC example

```bash
kubectl create secret generic wiki-oauth2 \
  --from-literal=client-id=YOUR_GOOGLE_CLIENT_ID \
  --from-literal=client-secret=YOUR_GOOGLE_CLIENT_SECRET \
  --from-literal=cookie-secret=$(openssl rand -base64 32) \
  -n tiddlywiki
```

```yaml
oauth2Proxy:
  enabled: true
  provider: oidc
  oidcIssuerUrl: https://accounts.google.com
  emailDomain: "yourcompany.com"   # restrict to your domain
  existingSecret: wiki-oauth2
```

---

## Plugin injection

Mount custom plugins without rebuilding the image. Plugins are picked up via `TIDDLYWIKI_PLUGIN_PATH`.

**From an inline ConfigMap** (small plugins):

```yaml
plugins:
  - name: my-banner
    data:
      plugin.info: |
        {"title":"$:/plugins/custom/my-banner","name":"My Banner","description":"Adds a banner"}
      banner.tid: |
        title: $:/plugins/custom/my-banner/banner
        tags: $:/tags/PageTemplate
        <div class="my-banner">Hello from a ConfigMap plugin!</div>
```

**From an existing ConfigMap** (pre-created, e.g. from a large plugin):

```bash
kubectl create configmap my-plugin \
  --from-file=plugin.info=./myplugin/plugin.info \
  --from-file=myplugin.js=./myplugin/myplugin.js \
  -n tiddlywiki
```

```yaml
plugins:
  - name: my-plugin
    existingConfigMap: my-plugin
```

---

## Git backup

Automatically commit and push wiki changes to a git repository on a schedule:

**SSH remote (recommended):**

```bash
# Generate a deploy key
ssh-keygen -t ed25519 -f wiki-deploy-key -N ""
# Add wiki-deploy-key.pub as a deploy key on your backup repo (with write access)

kubectl create secret generic wiki-git-ssh \
  --from-file=id_rsa=./wiki-deploy-key \
  -n tiddlywiki
```

```yaml
gitSync:
  enabled: true
  repoUrl: "git@github.com:youruser/wiki-backup.git"
  branch: main
  schedule: "0 * * * *"     # every hour
  existingSecret: wiki-git-ssh
```

**HTTPS remote:**

```bash
kubectl create secret generic wiki-git-https \
  --from-literal=GIT_USERNAME=youruser \
  --from-literal=GIT_PASSWORD=ghp_yourtoken \
  -n tiddlywiki
```

```yaml
gitSync:
  enabled: true
  repoUrl: "https://github.com/youruser/wiki-backup.git"
  branch: main
  existingSecret: wiki-git-https
```

---

## VolumeSnapshot backups

Create CSI snapshots of the wiki PVC on a schedule (requires a CSI driver that supports `VolumeSnapshot`):

```yaml
volumeSnapshotBackup:
  enabled: true
  schedule: "0 2 * * *"        # 2am daily
  retentionCount: 7            # keep 7 snapshots
  snapshotClass: "csi-hostpath-snapclass"   # your cluster's VolumeSnapshotClass
```

---

## High availability

> **Requires a ReadWriteMany storage class** (NFS, CephFS, AWS EFS, etc.)
> TiddlyWiki writes files directly to disk — multiple pods sharing a ReadWriteOnce PVC will corrupt data.

```bash
helm upgrade --install tiddlywiki mibmal/tiddlywiki \
  --namespace tiddlywiki --create-namespace \
  -f helm/tiddlywiki/values-ha.yaml \
  --set persistence.storageClass=nfs-client
```

The `values-ha.yaml` preset configures:
- 2 replicas with `RollingUpdate` strategy
- Hard pod anti-affinity (no two pods on the same node)
- Zone spreading preference
- HPA (2–4 replicas, CPU 70% / memory 80%)
- PodDisruptionBudget (`minAvailable: 1`)

---

## Observability (OpenTelemetry)

Enable the OTEL sidecar collector to forward traces and metrics to any OTLP-compatible backend (Grafana, Jaeger, Tempo, Datadog, etc.):

```bash
helm upgrade --install tiddlywiki mibmal/tiddlywiki \
  --namespace tiddlywiki --create-namespace \
  -f helm/tiddlywiki/values-otel.yaml
```

Configure your backend in `values-otel.yaml` under `otel.sidecar.config.exporters`.

For **Prometheus Operator** integration:

```yaml
serviceMonitor:
  enabled: true
  interval: 30s
```

---

## Kustomize

If you prefer Kustomize over Helm:

```bash
# Dev (NodePort 30080, reduced resources)
kubectl apply -k k8s/overlays/dev

# Prod (nginx Ingress, cert-manager TLS, retain PVC)
# Edit k8s/overlays/prod/ingress.yaml to set your domain first
kubectl apply -k k8s/overlays/prod
```

---

## Building the image locally

```bash
docker build -t mibmal/tiddlywiki:dev .

# Test it
docker run --rm -p 8080:8080 mibmal/tiddlywiki:dev
```

The CI workflow (`.github/workflows/docker-publish.yml`) builds `linux/amd64` and `linux/arm64` and pushes to Docker Hub on every push to `master` and on version tags (`v*.*.*`).

---

## Image security

- Base: `gcr.io/distroless/nodejs22-debian12` — no shell, no package manager, no setuid binaries
- Runs as `nonroot` uid 65532 (never root)
- `readOnlyRootFilesystem: true` — only `/data/wiki` (PVC mount) and `/tmp` (tmpfs) are writable
- All Linux capabilities dropped
- `seccompProfile: RuntimeDefault`
- Pod Security Standards: `restricted` namespace label enforced
- SBOM and provenance attestations attached to every Docker Hub image

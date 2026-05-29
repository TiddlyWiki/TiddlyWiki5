{{/*
Expand the name of the chart.
*/}}
{{- define "tiddlywiki.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "tiddlywiki.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label.
*/}}
{{- define "tiddlywiki.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "tiddlywiki.labels" -}}
helm.sh/chart: {{ include "tiddlywiki.chart" . }}
{{ include "tiddlywiki.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "tiddlywiki.selectorLabels" -}}
app.kubernetes.io/name: {{ include "tiddlywiki.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service account name.
*/}}
{{- define "tiddlywiki.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "tiddlywiki.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
OTEL sidecar collector ConfigMap name.
*/}}
{{- define "tiddlywiki.otelCollectorName" -}}
{{- printf "%s-otel-collector" (include "tiddlywiki.fullname" .) }}
{{- end }}

{{/*
Resolve the OTEL endpoint: user-supplied or default to sidecar localhost.
*/}}
{{- define "tiddlywiki.otelEndpoint" -}}
{{- if .Values.otel.endpoint }}
{{- .Values.otel.endpoint }}
{{- else if .Values.otel.sidecar.enabled }}
{{- if eq .Values.otel.protocol "grpc" }}
{{- "http://localhost:4317" }}
{{- else }}
{{- "http://localhost:4318" }}
{{- end }}
{{- else }}
{{- "http://otel-collector:4317" }}
{{- end }}
{{- end }}

{{/*
The named port the Service targets.
When oauth2-proxy is enabled the proxy sits in front, so the Service
port name changes to "proxy". Otherwise it targets "http" on the wiki.
*/}}
{{- define "tiddlywiki.serviceTargetPort" -}}
{{- if .Values.oauth2Proxy.enabled -}}proxy{{- else -}}http{{- end -}}
{{- end }}

{{/*
Build the flat list of --listen key=value args for TiddlyWiki.
Rendered as a YAML string list for use in container args.
*/}}
{{- define "tiddlywiki.listenArgs" -}}
{{- $args := list -}}
{{- $args = append $args "host=0.0.0.0" -}}
{{- $args = append $args (printf "port=%d" (int .Values.wiki.port)) -}}
{{- if .Values.wiki.pathPrefix }}
{{- $args = append $args (printf "path-prefix=%s" .Values.wiki.pathPrefix) -}}
{{- end }}
{{- if .Values.wiki.gzip }}
{{- $args = append $args "gzip=yes" -}}
{{- end }}
{{- if .Values.wiki.browserCache }}
{{- $args = append $args "use-browser-cache=yes" -}}
{{- end }}
{{- if .Values.auth.enabled }}
{{- if .Values.auth.readers }}
{{- $args = append $args (printf "readers=%s" .Values.auth.readers) -}}
{{- end }}
{{- if .Values.auth.writers }}
{{- $args = append $args (printf "writers=%s" .Values.auth.writers) -}}
{{- end }}
{{- if .Values.auth.admin }}
{{- $args = append $args (printf "admin=%s" .Values.auth.admin) -}}
{{- end }}
{{- if .Values.auth.anonUsername }}
{{- $args = append $args (printf "anon-username=%s" .Values.auth.anonUsername) -}}
{{- end }}
{{- if .Values.auth.credentialsSecret }}
{{- $args = append $args "credentials=/secrets/credentials.csv" -}}
{{- else if and .Values.auth.username .Values.auth.password }}
{{- $args = append $args (printf "username=%s" .Values.auth.username) -}}
{{- $args = append $args (printf "password=%s" .Values.auth.password) -}}
{{- end }}
{{- if .Values.oauth2Proxy.enabled }}
{{- $args = append $args (printf "authenticated-user-header=%s" .Values.oauth2Proxy.upstreamHeader) -}}
{{- else if .Values.auth.trustedHeader }}
{{- $args = append $args (printf "authenticated-user-header=%s" .Values.auth.trustedHeader) -}}
{{- end }}
{{- end }}
{{- range .Values.wiki.extraListenArgs }}
{{- $args = append $args . -}}
{{- end }}
{{- toYaml $args }}
{{- end }}

{{/*
oauth2-proxy Secret name.
*/}}
{{- define "tiddlywiki.oauth2SecretName" -}}
{{- .Values.oauth2Proxy.existingSecret | default (printf "%s-oauth2" (include "tiddlywiki.fullname" .)) }}
{{- end }}

{{/*
Git sync Secret name.
*/}}
{{- define "tiddlywiki.gitSyncSecretName" -}}
{{- .Values.gitSync.existingSecret | default (printf "%s-git-sync" (include "tiddlywiki.fullname" .)) }}
{{- end }}

{{/*
Plugin ConfigMap name for a given plugin entry.
*/}}
{{- define "tiddlywiki.pluginConfigMapName" -}}
{{- printf "%s-plugin-%s" (include "tiddlywiki.fullname" .root) .plugin.name }}
{{- end }}

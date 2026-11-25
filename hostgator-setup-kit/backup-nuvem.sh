#!/usr/bin/env bash
# Backup do BANCO na nuvem do cliente (Google Drive ou outro destino do rclone).
#
#   bash hostgator-setup-kit/backup-nuvem.sh             # backup agora + envio
#   bash hostgator-setup-kit/backup-nuvem.sh --agendar   # todo dia às 03:00 (cron)
#   bash hostgator-setup-kit/backup-nuvem.sh --desagendar
#
# Vai SÓ o dump do banco (db-*.sql.gz). Sessões do WhatsApp e anexos ficam na
# VPS, no backup local de sempre (backup.sh).
#
# O destino é um remoto CRIPTOGRAFADO do rclone (tipo `crypt` sobre o Drive):
# o Google guarda só arquivos ilegíveis, e quem tem a senha da cripto restaura.
# Configuração (uma vez) e restauração: docs/runbooks/backup-google-drive.md.
#
# .env:
#   BACKUP_NUVEM_REMOTO=drive-cripto:     # remoto crypt do rclone (obrigatório)
#   BACKUP_NUVEM_DIAS=30                  # apaga da nuvem o que passar disso
source "$(dirname "$0")/_common.sh"
enter_project

REMOTO="${BACKUP_NUVEM_REMOTO:-}"
DIAS="${BACKUP_NUVEM_DIAS:-30}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
LOG="$BACKUP_DIR/backup-nuvem.log"

agendar() {
  command -v crontab >/dev/null 2>&1 || die "'crontab' não encontrado nesta VPS."
  local legado="cd ${PROJECT_DIR} && bash hostgator-setup-kit/backup-nuvem.sh"
  local marcador; marcador="$(cron_tag backup-nuvem)"
  local linha="0 3 * * * ${legado} >/dev/null 2>&1 ${marcador}"
  ( { crontab -l 2>/dev/null || true; } | cron_merge "$marcador" "$legado" "$linha" ) | crontab -
  c_grn "✓ backup na nuvem agendado: todo dia às 03:00 (log em $LOG)"
}

desagendar() {
  local legado="cd ${PROJECT_DIR} && bash hostgator-setup-kit/backup-nuvem.sh"
  local marcador; marcador="$(cron_tag backup-nuvem)"
  ( { crontab -l 2>/dev/null || true; } | { grep -vF -e "$marcador" | grep -vF -e "$legado"; } || true ) | crontab -
  c_grn "✓ backup na nuvem desagendado"
}

case "${1:-}" in
  --agendar) agendar; exit 0 ;;
  --desagendar) desagendar; exit 0 ;;
  "") ;;
  *) die "uso: bash hostgator-setup-kit/backup-nuvem.sh [--agendar|--desagendar]" ;;
esac

command -v rclone >/dev/null 2>&1 \
  || die "rclone não instalado. Instale com: curl -fsSL https://rclone.org/install.sh | bash"
[ -n "$REMOTO" ] || die "falta BACKUP_NUVEM_REMOTO no .env (ex.: drive-cripto:). Ver docs/runbooks/backup-google-drive.md"
case "$DIAS" in ''|*[!0-9]*) die "BACKUP_NUVEM_DIAS precisa ser um número de dias (ex.: 30)";; esac
rclone listremotes 2>/dev/null | grep -qxF "${REMOTO%%:*}:" \
  || die "o remoto '${REMOTO%%:*}:' não existe no rclone desta VPS (rclone listremotes)."

mkdir -p "$BACKUP_DIR"
exec > >(tee -a "$LOG") 2>&1
step "$(date '+%Y-%m-%d %H:%M') — backup local"
bash "$KIT_DIR/backup.sh"

dump="$(ls -1t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | head -1 || true)"
[ -n "$dump" ] || die "o backup.sh terminou, mas não achei nenhum db-*.sql.gz em $BACKUP_DIR."

step "Enviando $(basename "$dump") para ${REMOTO}"
rclone copy "$dump" "$REMOTO" --retries 5 --low-level-retries 10
rclone lsf "$REMOTO" --include "$(basename "$dump")" | grep -qxF "$(basename "$dump")" \
  || die "o envio não se confirmou: $(basename "$dump") não aparece em ${REMOTO}."
c_grn "✓ banco na nuvem: $(basename "$dump")"

step "Retenção na nuvem: apagando dumps com mais de ${DIAS} dias"
rclone delete "$REMOTO" --include 'db-*.sql.gz' --min-age "${DIAS}d"
c_grn "✓ nuvem com $(rclone lsf "$REMOTO" --include 'db-*.sql.gz' | wc -l) dump(s)"

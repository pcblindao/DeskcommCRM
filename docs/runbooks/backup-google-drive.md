# Backup do banco no Google Drive do cliente

`hostgator-setup-kit/backup-nuvem.sh` faz o backup local de sempre (`backup.sh`) e envia **só o
dump do banco** (`db-*.sql.gz`) para o Google Drive do cliente, **criptografado** pelo rclone. O
Google guarda arquivos ilegíveis; quem tem a senha da cripto restaura. No Drive, ficam os últimos
`BACKUP_NUVEM_DIAS` dias (padrão 30).

Sessões do WhatsApp e anexos não vão: ficam no backup local da VPS (`backups/`).

## O que é preciso

| De quem | O quê |
|---|---|
| Cliente | Uma conta Google (Gmail ou Workspace) com espaço livre, e 1 minuto para entrar nela e clicar em **Permitir** |
| Nós | Uma senha de criptografia forte, entregue ao cliente por canal seguro. **Sem ela, o backup não abre.** |

A permissão pedida ao Google é `drive.file`: o rclone enxerga **só os arquivos que ele mesmo criou**,
não o resto do Drive do cliente.

## Configurar (uma vez por cliente)

### 1. Na VPS: instalar o rclone

```bash
curl -fsSL https://rclone.org/install.sh | bash
```

### 2. No PC (com navegador): autorizar a conta do cliente

Instale o rclone no PC (`winget install Rclone.Rclone` no Windows) e rode:

```bash
rclone authorize "drive" "eyJzY29wZSI6ImRyaXZlLmZpbGUifQ=="
```

Abre o navegador: **o cliente entra na conta Google dele** e clica em **Permitir**. Use uma janela
anônima para não misturar com a sua conta. O terminal mostra um bloco `{"access_token":...}`: copie
o bloco inteiro (é a chave de acesso ao Drive; não mande por chat aberto).

### 3. Na VPS: criar o remoto do Drive e o criptografado

```bash
rclone config create drive drive scope drive.file config_is_local false token '<COLE O BLOCO>'
```

```bash
rclone config create drive-cripto crypt remote drive:Backup-CRM password '<SENHA DA CRIPTO>' --obscure
```

O `--obscure` grava a senha embaralhada no `rclone.conf`; guarde a senha original com o cliente.

### 4. Na VPS: ligar no `.env` e agendar

```bash
cd /opt/deskcommcrm
printf 'BACKUP_NUVEM_REMOTO=drive-cripto:\nBACKUP_NUVEM_DIAS=30\n' >> .env
```

```bash
bash hostgator-setup-kit/backup-nuvem.sh
```

```bash
bash hostgator-setup-kit/backup-nuvem.sh --agendar
```

A primeira rodada prova o caminho inteiro (backup, envio, conferência). No Drive do cliente aparece a
pasta **Backup-CRM** com nomes embaralhados: é a criptografia.

## Restaurar

```bash
rclone lsf drive-cripto:
```

```bash
rclone copy drive-cripto:db-AAAAMMDD-HHMMSS.sql.gz /opt/deskcommcrm/backups/
```

Depois, o caminho normal do kit: `bash hostgator-setup-kit/restore.sh` com esse arquivo.

Numa VPS nova, recrie os dois remotos (passos 2 e 3) com a **mesma senha da cripto**.

## Conferir

- Log: `backups/backup-nuvem.log`.
- Agendamento: `crontab -l | grep backup-nuvem`.
- Parar: `bash hostgator-setup-kit/backup-nuvem.sh --desagendar`.

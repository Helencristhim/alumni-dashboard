# Ambientes do Dashboard Alumni

## Estrutura de Branches

| Branch | Ambiente | URL Vercel |
|--------|----------|------------|
| `main` | Produção | https://alumni-dashboard-nine.vercel.app |
| `homologation` | Homologação | https://alumni-dashboard-git-homologation-helen-mendes-projects.vercel.app |
| `development` | Desenvolvimento | https://alumni-dashboard-git-development-helen-mendes-projects.vercel.app |

## Fluxo de Trabalho

```
development → homologation → main (produção)
```

1. **Desenvolvimento**: Faça alterações na branch `development`
2. **Homologação**: Merge de `development` para `homologation` para testar
3. **Produção**: Merge de `homologation` para `main` após aprovação

## Comandos Git

### Trabalhar em desenvolvimento:
```bash
git checkout development
# fazer alterações
git add .
git commit -m "feat: nova funcionalidade"
git push origin development
```

### Promover para homologação:
```bash
git checkout homologation
git merge development
git push origin homologation
```

### Promover para produção:
```bash
git checkout main
git merge homologation
git push origin main
```

## Configuração Local

Para rodar localmente em cada ambiente:

```bash
# Desenvolvimento
cp .env.development .env.local
npm run dev

# Homologação
cp .env.homologation .env.local
npm run dev

# Produção (cuidado!)
cp .env.production .env.local
npm run dev
```

## Bancos de Dados (Neon)

Cada ambiente deve ter seu próprio banco de dados:

| Ambiente | Database |
|----------|----------|
| Produção | `neondb` |
| Homologação | `alumni_homolog` |
| Desenvolvimento | `alumni_dev` |

### Criar bancos no Neon:
1. Acesse https://console.neon.tech
2. No projeto existente, vá em "Databases"
3. Crie `alumni_dev` e `alumni_homolog`
4. Copie as connection strings para os arquivos .env correspondentes

## Variáveis no Vercel

Configure em: https://vercel.com/helen-mendes-projects/alumni-dashboard/settings/environment-variables

Cada variável deve ser configurada para o ambiente correto:
- **Production**: branch `main`
- **Preview**: branches `homologation` e `development`

Para separar homologation de development no Vercel, use a opção "Branch-specific variables" (plano Pro) ou mantenha ambos com as mesmas variáveis de preview.

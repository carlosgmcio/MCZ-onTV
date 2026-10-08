# Avaliações com publicação automática

Novas avaliações são criadas em `reviews/{uid}` com `status: "approved"`.
As listagens em `/` e `/inicio` usam `onSnapshot`, filtram somente `approved`,
ordenam por `createdAt` decrescente e limitam a 24 relatos. Atualizam sem recarregar.
Relatos antigos `pending` e `rejected` continuam ocultos; não há migração.

## Publicação das regras

Copie `firestore.rules` atualizado para a aba Regras do Firebase Console do
projeto existente e publique. Preserve regras de outros recursos, se houver.
Permissões amplas em matches sobrepostos podem autorizar operações negadas aqui.
A criação agora exige `request.resource.data.status == 'approved'`.
As regras antigas que exigem `pending` rejeitarão os novos envios.
O índice de `firestore.indexes.json` continua necessário: coleção `reviews`,
`status` crescente e `createdAt` decrescente.
Nenhuma regra, índice ou configuração remota foi publicada automaticamente.

## Proteção preservada

Somente contas Google podem criar. O documento usa o UID; nome e foto são
validados contra o token autenticado. O cliente não escolhe status ou autoria.
Campos exatos, nota inteira de 1 a 5, comentário de 10 a 1000 caracteres com
conteúdo e timestamp do servidor igual a `request.time` continuam obrigatórios.
Update e delete são proibidos ao cliente. O ID determinístico e a permissão
apenas de criação impedem uma segunda avaliação pela mesma conta, inclusive
em tentativas simultâneas. Nenhum e-mail é armazenado.
Nome, comentário e foto autorizada serão públicos imediatamente.
Login Google não comprova contratação. Administração dos relatos continua
restrita ao Console com IAM ou acesso Admin confiável.

## Validação

`npm test` verifica o envio com SDK simulado, validação de conteúdo, identidade,
duplicidade, status aprovado, listagem em tempo real e invariantes das regras.
Essas verificações não executam as regras em um Emulator Firestore.
Após publicar as regras, confirme com uma conta Google que um relato real aparece
automaticamente e que reenvio, update, delete e status diferente de `approved`
são negados. Não use relatos fictícios no banco de produção.

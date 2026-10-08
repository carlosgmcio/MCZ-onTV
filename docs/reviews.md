# Avaliações reais e moderação

Não há avaliações de exemplo. A seção aparece após os planos em `/inicio` e
também na entrada pública `/`. O Firestore consultado é o do aplicativo Firebase
já configurado, sem novas variáveis, projeto ou credenciais privadas.

## Preparação no Firebase existente

1. No Console do projeto atual, abra Firestore Database. Se ainda não existir,
   crie o banco **Standard / Native**, com ID `(default)`, em modo de produção.
   Escolha conscientemente a região; não crie outro projeto Firebase.
2. Revise e publique `firestore.rules` na aba Regras. Não use regras de teste
   abertas. Se houver regras de outros recursos no Console, incorpore apenas
   o bloco de `reviews` às regras existentes, preservando o restante. Não
   mantenha permissões amplas que autorizem writes em `reviews` por outro match:
   permissões de matches sobrepostos são somadas (OR).
3. Crie o índice composto de coleção `reviews`: `status` crescente e `createdAt`
   decrescente, como em `firestore.indexes.json`. Aguarde ficar ativo.
4. Alternativamente, um administrador autenticado no Firebase CLI pode publicar
   os arquivos revisados com `firebase deploy --only firestore --project ID_REAL`.
   Substitua `ID_REAL` pelo ID do projeto existente; o CLI não foi instalado e
   nenhuma configuração em nuvem foi publicada automaticamente por esta mudança.

## Dados e proteção

`reviews/{uid}` contém `userId`, `publicName` (primeiro nome), `photoURL` (vazio
por padrão, opcional com consentimento), `rating` (inteiro 1–5), `comment`
(10–1000 caracteres), `createdAt` (timestamp do servidor), `status` (`pending`).
Nenhum e-mail é armazenado. Evite aprovar comentários com dados pessoais.
O UID fica no documento; documentos aprovados são públicos. O Firestore não
oculta campos individuais em documentos acessíveis.

As regras validam UID, nome e foto contra o token Firebase autenticado, exigem
provedor Google, campos exatos e data do servidor. O cliente não pode atualizar,
aprovar ou excluir documentos. O ID determinístico e a permissão apenas de
criação limitam a **uma avaliação por conta**, mesmo com cliques simultâneos ou
chamadas feitas fora da interface. Não delete avaliações rejeitadas, para não
permitir reenvio pela mesma conta. Isso não impede abuso com múltiplas contas;
App Check e controles adicionais podem ser adotados futuramente.

## Aprovação segura

Não existe tela administrativa no site. Apenas uma pessoa com acesso IAM
administrativo ao projeto deve usar Firestore → Dados → `reviews` no Console.
Confira os relatos, verifique a relação com um cliente real pelo atendimento
existente e remova dados pessoais antes de publicar. Login Google sozinho não
comprova contratação. Para aprovar, altere `status` de `pending` para `approved`.
Para não publicar, mantenha `pending` ou marque `rejected`. Não altere `userId`,
nome ou autoria para simular outro cliente. Não atribua permissões administrativas
às contas de clientes. Uma futura API Admin deverá verificar autorização no
servidor e registrar moderação; não há chaves Admin neste frontend.

## Validação em ambiente real

Após publicar as regras e o índice, entre com Google e envie um relato real:
ele deve ficar `pending` e não aparecer publicamente. Confira que reenvio,
update do próprio status e tentativa de trocar UID são negados. No Console,
aprove o relato e confira sua publicação; `pending`/`rejected` permanecem ocultos.
Confira o consentimento da foto e ausência de e-mail. Os testes locais simulam
o SDK; não publicam relatos fictícios no Firebase. Testar as regras no Emulator
Suite exige Java e Firebase CLI, indisponíveis neste ambiente.

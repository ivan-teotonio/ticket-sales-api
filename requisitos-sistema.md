### **Entidades Principais**

1. **Parceiros**
   Representam os criadores de eventos e tickets.
   **Campos:**

- `id`: Indentificador único (numérico).
- `nome`: Nome completo do parceiro.
- `email`: E-mail para logine contato.
- `senha`: Senha criptografada.
- `nome da empresa`: Nome da empresa associada.

2. **Clientes**
   Representam os compradores de engressos.
   **Campos:**

- `id`: Identificador único (numérico).
- `nome`: Nome completo do cliente.
- `email`: E-mail para login e contato.
- `senha`: Senha criptografada.
- `endereço`: Endereço do cliente.
- `telefone`: Telefone do cliente.

3. **Eventos**
   Representam os eventos criados pelos parceiros.
   **Campos**

- `id`: Identificador único.
- `nome`: Nome do evento.
- `descricao`: Breve descrição do evento.
- `data`: Dara e hora do evento.
- `local`: Local onde será realizado.
- `parceiro_id`: ID do parceiro que criou o evento (chave estrageira).

4. **Tickets**
   Represetam os ingressos disponíveis para cada evento.
   **Campos**

- `id`: Identificador único.
- `evento_id`: ID do evento associado (chave estrangeira).
- `local`: Identificador do assento (e.g., A1, B2).
- `preco`: Preço disponível, vendido.
- `status`: Disponível, vendido.

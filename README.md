# Chat em Tempo Real com Kafka e WebSocket

Este projeto é um aplicativo de chat em tempo real que utiliza **Kafka** para gerenciamento de mensagens e **WebSocket** para comunicação em tempo real com os clientes. A aplicação é composta por duas partes principais:

1. **Servidor:** Backend implementado com Node.js, WebSocket, e Kafka.
2. **Cliente:** Frontend React.

---

## Requisitos

Certifique-se de ter os seguintes softwares instalados antes de começar:

- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/) (v18 ou superior)
- [NPM](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)

---

## Instruções para Configuração

### 1. Configurar o Kafka com Docker Compose

O `docker-compose.yml` contém a configuração para rodar o **Kafka** e o **Zookeeper**. Certifique-se de que o Docker está instalado e siga os passos abaixo:

1. **Iniciar os containers do Kafka e Zookeeper:**
   Na raiz do projeto, execute:

   ```bash
   docker-compose up -d
   ```

2. **Verificar os container**
   ```bash
   docker ps
   ```
3. **Entre e crie o topico no kafka**

   ```bash
   docker exec -it kafka bash

   kafka-topics --create --topic chat-messages --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1
   ```

4. **Verifique se o tópico foi criado**

   ```bash
   kafka-topics --list --bootstrap-server localhost:9092
   ```

### Baixar as dependencias (Cliente / Server)

1. **Rodar o seguinte comando**

```bash
   npm install
```

2. **Executar o server**

```bash
   npm run dev
```

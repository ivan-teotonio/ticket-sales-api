FROM node:21.7.1-slim 
# diretório de trabalho dentro do container
WORKDIR /usr/src/app
# copiar o package.json e package-lock.json para o diretório de trabalho
COPY . .
# instalar as dependências do projeto
RUN npm install
RUN npm run build

CMD [ "npm", "start" ]
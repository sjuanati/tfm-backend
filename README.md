# Trabajo Final de Master - Universitat Politècnica de Catalunya

La aplicación propuesta hace uso de las redes descentralizadas para realizar una trazabilidad de los medicamentos desde el momento en que abandonan la farmacia hasta que llegan al consumidor final, almacenando los datos de cada paso en transacciones que se registran en la Blockchain. Esto permite que la disponibilidad y la persistencia de la información sean la base para un sistema seguro, que garantiza que los datos recogidos en cada paso sean íntegros a través del uso de criptografía.

*** Esta es la versión de back-end que da soporte a los front-end de USUARIOS y FARMACIAS ***

## 1) Intalación

Esta aplicación require [Node.js](https://nodejs.org/) para poder ser ejecutada.

Para instalar la aplicación, clonar este repositorio y ejecutar:

```sh
$ npm install
```

## 2) Ejecución

Para ejecutar la aplicación:

```sh
$ nodemon
```

## 3) Entorno

La aplicación puede correr en modo HTTP (local) o HTTPS (Amazon Web Servies) según la configuración en el fichero: 

`/Environment.js`

## 4) Blockchain

Se ha usado una versión local de Ganache para MacOS para simular una blockchain de Ethereum. Para activar la funcionalidad de blockchain en otro entorno local, debería arrancarse un Ganache en modo CLI e importar las cuentas de test.


===== Installation =====

- Installer nodejs (nativement ou avec brew)

- Installer grunt-cli et bower (en sudo si besoin) : 

    ```
    $ sudo npm install -g grunt-cli
    $ sudo npm install -g bower
    ```

- Installer les dépendances back
    
    ```
    $ npm install
    ```

- Installer les dépendances front

    ```
    $ bower install
    ```
- Créer la base de données et éditer les confs
    
    ```
    server/app.js
    scripts/crawler.js
    ```
- Installer la BDD

    ```
    mysql -u USER -h HOST -p PASSWORD DB_NAME < schema.sql
    ```

- éditer node_modules/grunt-usemin/lib/htmlprocessor.js et remplacer la ligne 148 :
  
  ```
  this.relativeSrc = path.relative(process.cwd(), src);
  ```

  par 

  ```
  this.relativeSrc = path.relative(process.cwd(), dest || src);
  ```

- Installer le serveur. nodemon en dev, et pm2 en prod :

  ```
  $ sudo npm install -g nodemon # en dev
  $ sudo npm install -g pm2     # en prod
  ```
===== Déploiement =====


=== DEV ===
    
```
$ node scripts/crawler.js # Maj du des infos en BDD
$ grunt                   # Création et déploiement des assets
$ nodemon server/app.js   # Démarrage du serveur
```
=== PROD ===

```
$ NODE_ENV=production node scripts/crawler.js # Maj du des infos en BDD
$ grunt # Création et déploiement des assets
$ NODE_ENV=production pm2 start server/app.js -i 1 # Démarrage du serveur ("pm2 stop all" avant si nécessaire)
```


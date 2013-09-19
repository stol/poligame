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







===== Déploiement =====


=== DEV ===
Utiliser nodemon en DEV pour éviter d'avoir à relancer node après chaque modif
    
```
$ sudo npm install -g nodemon
$ nodemon server/app.js
$ node scripts/crawler.js
```



=== PROD ===


Installer pm2

```
$ sudo npm install -g pm2
```

Déploiement

```
$ NODE_ENV=production pm2 start server/app.js -i 1
$ NODE_ENV=production node scripts/crawler.js
```


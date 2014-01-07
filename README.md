## Installation

- Installer nodejs

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
- Créer la base de données avec le nom voulu 
  
  **En DEV**
  
  Éditer ``server/app.js`` et ``scripts/crawler.js`` pour y mettre les infos de connexion :
       
    ```
	var db = mysql.createConnection({
	    host     : 'localhost)',
	    user     : 'LE_USER',
	    password : 'LE_MOTDEPASSE',
	    database : 'LE_DATABASE'
	});
    ```
    
    **En prod**
    
    Éditer ``~/.profile`` ou ``~/.bashrc`` pour y mettre la config de prod : 
    
    ```
    export NODE_ENV=production
	export DB_HOST=localhost
	export DB_NAME=LE_DATABASE
	export DB_PASSWORD=LE_MOTDEPASSE
	export DB_USER=LE_USER
    ```
    
- Installer la BDD et ses tables

    ```
    $ mysql -u USER -h HOST -p PASSWORD DB_NAME < schema.sql
    ```

- Installer le serveur ``pm2`` en prod :

  ```
  $ sudo npm install -g pm2     # en prod
  ```
  
## Déploiement


### DEV
    
```
$ node scripts/crawler.js # Maj du des infos en BDD
$ node server/app.js      # Démarrage du serveur
```
### PROD

```
$ node scripts/crawler.js # Maj du des infos en BDD
$ grunt                   # Création et déploiement des assets
$ pm2 start server/app.js # Démarrage du serveur
```


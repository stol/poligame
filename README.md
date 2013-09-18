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

===== Tips =====

- Utiliser nodemon en DEV pour éviter d'avoir à relancer node après chaque modif
    
    ```
    $ sudo npm install -g nodemon
    ```

    puis

    ```
    $ nodemon server/app.js


- Utiliser PM2 en prod


- divers : voir https://medium.com/tech-talk/e7c0b0e5ce3c
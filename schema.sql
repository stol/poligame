



-- ---
-- Globals
-- ---

-- SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
-- SET FOREIGN_KEY_CHECKS=0;

-- ---
-- Table 'textes'
-- 
-- ---

DROP TABLE IF EXISTS `textes`;
    
CREATE TABLE `textes` (
  `id` INTEGER NULL AUTO_INCREMENT DEFAULT NULL,
  `text` MEDIUMTEXT NULL DEFAULT NULL,
  `pour` INTEGER NOT NULL DEFAULT 0,
  `contre` INTEGER NOT NULL DEFAULT 0,
  `abstention` INTEGER NOT NULL DEFAULT 0,
  `link` MEDIUMTEXT NULL DEFAULT NULL,
  `starts_at` TIMESTAMP NULL DEFAULT NULL,
  `ends_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- ---
-- Table 'votes'
-- 
-- ---

DROP TABLE IF EXISTS `votes`;
    
CREATE TABLE `votes` (
  `user_id` INTEGER NULL DEFAULT NULL,
  `texte_id` INTEGER NULL DEFAULT NULL,
KEY (`user_id`),
KEY (`texte_id`),
  PRIMARY KEY (`user_id`, `texte_id`)
);

-- ---
-- Table 'users'
-- 
-- ---

DROP TABLE IF EXISTS `users`;
    
CREATE TABLE `users` (
  `id` INTEGER NULL AUTO_INCREMENT DEFAULT NULL,
  `firstname` VARCHAR(255) NULL DEFAULT NULL,
  `lastname` VARCHAR(255) NULL DEFAULT NULL,
  `fullname` VARCHAR(255) NULL DEFAULT NULL,
  `nickname` VARCHAR(255) NULL DEFAULT NULL,
  `provider_user_id` VARCHAR(255) NULL DEFAULT NULL,
  `gender` INTEGER NULL DEFAULT NULL,
  `bio` MEDIUMTEXT NULL DEFAULT NULL,
  `link` MEDIUMTEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- ---
-- Foreign Keys 
-- ---

ALTER TABLE `votes` ADD FOREIGN KEY (user_id) REFERENCES `users` (`id`);
ALTER TABLE `votes` ADD FOREIGN KEY (texte_id) REFERENCES `textes` (`id`);

-- ---
-- Table Properties
-- ---

ALTER TABLE `textes` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `votes` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `users` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ---
-- Test Data
-- ---

INSERT INTO `textes` (`id`, `text`, `pour`, `contre`, `abstention`, `starts_at`, `ends_at`) VALUES
  (null, 'Proposition de loi de M. Philippe Armand Martin (Marne) et plusieurs de ses collègues garantissant le versement des allocations familiales du premier au quatrième enfant à charge', 480, 350, 30, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY),
  (null, 'Proposition de loi de M. Michel Heinrich visant à rétablir les droits des veuves de fonctionnaires civils dans les cas où existe un enfant naturel de moins de 21 ans', 650, 1580, 180, NOW() + INTERVAL 5 DAY,  NOW() + INTERVAL 10 DAY),
  (null, 'Proposition de loi visant à redonner des perspectives à l\'économie réelle et à l\'emploi industriel', 14802, 19541, 1500, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY),
  (null, 'Projet de loi relatif à la transparence de la vie publique', 800,900,100, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY);

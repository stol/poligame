



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
  `type` INTEGER NULL DEFAULT NULL,
  `id_hash` INTEGER NULL DEFAULT NULL,
  `title` MEDIUMTEXT NULL DEFAULT NULL,
  `description` MEDIUMTEXT NULL DEFAULT NULL,
  `description_title` MEDIUMTEXT NULL DEFAULT NULL,
  `pour` INTEGER NOT NULL DEFAULT 0,
  `contre` INTEGER NOT NULL DEFAULT 0,
  `abstention` INTEGER NOT NULL DEFAULT 0,
  `pour_assemblee` INTEGER NOT NULL DEFAULT 0,
  `contre_assemblee` INTEGER NOT NULL DEFAULT 0,
  `abstention_assemblee` INTEGER NOT NULL DEFAULT 0,
  `link` MEDIUMTEXT NULL DEFAULT NULL,
  `starts_at` TIMESTAMP NULL DEFAULT NULL,
  `ends_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
KEY (`id_hash`),
KEY (`id`, `type`)
);

-- ---
-- Table 'votes'
-- 
-- ---

DROP TABLE IF EXISTS `votes`;
    
CREATE TABLE `votes` (
  `user_id` INTEGER NULL DEFAULT NULL,
  `obj_id` INTEGER NULL DEFAULT NULL,
  `obj_type` INTEGER NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
KEY (`obj_id`, `obj_type`),
  PRIMARY KEY (`user_id`, `obj_type`, `obj_id`)
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
  `bord` INTEGER NOT NULL DEFAULT 0,
  `csp` INTEGER NULL DEFAULT NULL,
  `birth` INTEGER NULL DEFAULT NULL,
  `bio` MEDIUMTEXT NULL DEFAULT NULL,
  `link` MEDIUMTEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- ---
-- Table 'amendements'
-- 
-- ---

DROP TABLE IF EXISTS `amendements`;
    
CREATE TABLE `amendements` (
  `id` INTEGER NULL AUTO_INCREMENT DEFAULT NULL,
  `type` INTEGER NULL DEFAULT NULL,
  `texte_id` INTEGER NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
KEY (`id`, `type`),
KEY (`texte_id`)
);

-- ---
-- Table 'articles'
-- 
-- ---

DROP TABLE IF EXISTS `articles`;
    
CREATE TABLE `articles` (
  `id` INTEGER NULL AUTO_INCREMENT DEFAULT NULL,
  `type` INTEGER NULL DEFAULT NULL,
  `texte_id` INTEGER NULL DEFAULT NULL,
  `number` INTEGER NULL DEFAULT NULL,
  `title` MEDIUMTEXT NULL DEFAULT NULL,
  `content` MEDIUMTEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
KEY (`id`, `type`),
KEY (`texte_id`)
);

-- ---
-- Table 'votes_anon'
-- 
-- ---

DROP TABLE IF EXISTS `votes_anon`;
    
CREATE TABLE `votes_anon` (
  `obj_id` INTEGER NULL DEFAULT NULL,
  `obj_type` INTEGER NULL DEFAULT NULL,
  `gender` INTEGER NULL DEFAULT NULL,
  `bord` INTEGER NULL DEFAULT NULL,
  `csp` INTEGER NULL DEFAULT NULL,
  `age` INTEGER NULL DEFAULT NULL,
  `choice` INTEGER NULL DEFAULT NULL,
KEY (`obj_id`, `obj_type`)
);

-- ---
-- Foreign Keys 
-- ---

-- ALTER TABLE `votes` ADD FOREIGN KEY (obj_id, obj_type) REFERENCES `amendements` (`id`, `type`);
-- ALTER TABLE `votes` ADD FOREIGN KEY (obj_id, obj_type) REFERENCES `articles` (`id`, `type`);
-- ALTER TABLE `votes` ADD FOREIGN KEY (obj_id, obj_type) REFERENCES `textes` (`id`, `type`);

-- ALTER TABLE `votes_anon` ADD FOREIGN KEY (obj_id, obj_type) REFERENCES `amendements` (`id`, `type`);
-- ALTER TABLE `votes_anon` ADD FOREIGN KEY (obj_id, obj_type) REFERENCES `articles` (`id`, `type`);
-- ALTER TABLE `votes_anon` ADD FOREIGN KEY (obj_id, obj_type) REFERENCES `textes` (`id`, `type`);

-- ---
-- Table Properties
-- ---

ALTER TABLE `textes` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `votes` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `users` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `amendements` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `articles` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `votes_anon` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ---
-- Test Data
-- ---

INSERT INTO `textes` (`id`, `type`, `title`, `link`, `pour`, `contre`, `abstention`, `pour_assemblee`, `contre_assemblee`, `abstention_assemblee`, `starts_at`, `ends_at`) VALUES
  (null, 1, 'Proposition de loi visant à redonner des perspectives à l\'économie réelle et à l\'emploi industriel', 'http://www.google.fr', 14802, 19541, 1500, 250, 350, 80, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY);


INSERT INTO `votes_anon` (`obj_id`, `obj_type`, `gender`, `bord`, `csp`, `choice`, `age`) VALUES
  (1, 1, 1, 6, 1, 1, 18),
  (1, 1, 1, 2, 3, 2, 20),
  (1, 1, 2, 2, 5, 2, 35),
  (1, 1, 1, 1, 7, 3, 19),
  (1, 1, 1, 2, 2, 1, 25),
  (1, 1, 2, 2, 4, 2, 65),
  (1, 1, 1, 3, 6, 2, 45),
  (1, 1, 1, 3, 8, 2, 47),
  (1, 1, 2, 4, 1, 1, 36),
  (1, 1, 1, 6, 2, 1, 23),
  (1, 1, 2, 7, 1, 1, 19),
  (1, 1, 2, 2, 2, 1, 18),
  (1, 1, 1, 7, 6, 2, 20),
  (1, 1, 1, 4, 2, 2, 28),
  (1, 1, 2, 6, 8, 1, 29),
  (1, 1, 1, 2, 2, 1, 36),
  (1, 1, 1, 2, 3, 2, 47),
  (1, 1, 2, 7, 4, 2, 48),
  (1, 1, 2, 7, 5, 1, 49),
  (1, 1, 1, 1, 8, 1, 36),
  (1, 1, 1, 2, 7, 1, 75),
  (1, 1, 1, 4, 6, 2, 46),
  (1, 1, 2, 6, 5, 1, 76),
  (1, 1, 2, 3, 4, 2, 39),
  (1, 1, 1, 3, 1, 3, 49),
  (1, 1, null, 5, 1, 3, null),
  (1, 1, 2, 3, 4, 1, null),
  (1, 1, 1, 5, 3, 2, 54),
  (1, 1, 2, null, 7, 2, null),
  (1, 1, 1, 3, 1, 1, 56),
  (1, 1, 2, 1, 7, 1, 36),
  (1, 1, 2, 7, null, 1, 38),
  (1, 1, 1, 2, 8, 1, 27),
  (1, 1, 2, 3, 8, 2, null),
  (1, 1, 2, 4, 8, 1, 23),
  (1, 1, 1, 7, 4, 2, 29),
  (1, 1, 2, 6, null, 2, null),
  (1, 1, 2, 5, 3, 1, 22),
  (1, 1, 1, 4, 1, 3, 65),
  (1, 1, 1, null, 8, 2, null),
  (1, 1, 1, 3, 5, 1, 54),
  (1, 1, 2, 2, 7, 2, 53),
  (1, 1, 2, null, 4, 2, null),
  (1, 1, 1, 1, 3, 2, 36),
  (1, 1, 2, 2, 4, 2, null),
  (1, 1, null, 2, 7, 1, 45),
  (1, 1, 1, 2, 5, 2, 30),
  (1, 1, 2, null, 5, 1, 31),
  (1, 1, 1, 4, null, 1, 32),
  (1, 1, 1, 4, 3, 1, null);

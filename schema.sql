



-- ---
-- Globals
-- ---

-- SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
-- SET FOREIGN_KEY_CHECKS=0;

-- ---
-- Table 'questions'
-- 
-- ---

DROP TABLE IF EXISTS `questions`;
		
CREATE TABLE `questions` (
  `id` INTEGER NULL AUTO_INCREMENT DEFAULT NULL,
  `text` MEDIUMTEXT NULL DEFAULT NULL,
  `pour` INTEGER NULL DEFAULT NULL,
  `contre` INTEGER NULL DEFAULT NULL,
  `abstention` INTEGER NULL DEFAULT NULL,
  `link` MEDIUMTEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
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
  `question_id` INTEGER NULL DEFAULT NULL,
KEY (`user_id`),
KEY (`question_id`),
  PRIMARY KEY (`user_id`, `question_id`)
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
ALTER TABLE `votes` ADD FOREIGN KEY (question_id) REFERENCES `questions` (`id`);

-- ---
-- Table Properties
-- ---

ALTER TABLE `questions` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `votes` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `users` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ---
-- Test Data
-- ---

INSERT INTO `questions` (`id`,`text`,`pour`,`contre`,`abstention`) VALUES
  (null, 'Proposition de loi de M. Philippe Armand Martin (Marne) et plusieurs de ses collègues garantissant le versement des allocations familiales du premier au quatrième enfant à charge',5,5,2),
  (null, 'Proposition de loi de M. Michel Heinrich visant à rétablir les droits des veuves de fonctionnaires civils dans les cas où existe un enfant naturel de moins de 21 ans',10,7,3),
  (null, 'Proposition de loi visant à redonner des perspectives à l\'économie réelle et à l\'emploi industriel',4,21,5),
  (null, 'Projet de loi relatif à la transparence de la vie publique',30,150,25);
INSERT INTO `users` (`id`) VALUES
  (1),
  (2),
  (3);

INSERT INTO `votes` (`user_id`,`question_id`) VALUES
  (1,1),
  (1,2),
  (1,3),
  (2,1),
  (2,2),
  (2,3),
  (3,1),
  (3,2),
  (3,3);


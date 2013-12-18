-- ---
-- Globals
-- ---

-- SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
-- SET FOREIGN_KEY_CHECKS=0;

-- ---
-- Table 'textes'
-- 
-- ---

DROP TABLE IF EXISTS `bills`;

CREATE TABLE `bills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) DEFAULT NULL,
  `id_hash` int(11) DEFAULT NULL,
  `title` mediumtext CHARACTER SET latin1,
  `communique` mediumtext CHARACTER SET latin1,
  `communique_title` mediumtext CHARACTER SET latin1,
  `pour` int(11) NOT NULL DEFAULT '0',
  `contre` int(11) NOT NULL DEFAULT '0',
  `abstention` int(11) NOT NULL DEFAULT '0',
  `pour_assemblee` int(11) NOT NULL DEFAULT '0',
  `contre_assemblee` int(11) NOT NULL DEFAULT '0',
  `abstention_assemblee` int(11) NOT NULL DEFAULT '0',
  `url_lf` mediumtext CHARACTER SET latin1,
  `url_an` mediumtext CHARACTER SET latin1,
  `url_sn` mediumtext CHARACTER SET latin1,
  `status` int(11) DEFAULT '0',
  `analysed` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_hash` (`id_hash`),
  KEY `id` (`id`,`type`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;


DROP TABLE IF EXISTS `seances`;

CREATE TABLE `seances` (
  `bill_id` int(11) DEFAULT NULL,
  `lecture` int(11) unsigned DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  UNIQUE KEY `seance` (`bill_id`,`lecture`,`date`),
  KEY `lecture` (`bill_id`,`lecture`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---
-- Table 'votes'
-- 
-- ---

DROP TABLE IF EXISTS `votes`;
    
CREATE TABLE `votes` (
  `user_id` VARCHAR(15) NULL DEFAULT NULL,
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
  `id` VARCHAR(15) NULL DEFAULT NULL,
  `firstname` VARCHAR(255) NULL DEFAULT NULL,
  `lastname` VARCHAR(255) NULL DEFAULT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `link` MEDIUMTEXT NULL DEFAULT NULL,
  `is_qualified` INTEGER NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  `number` VARCHAR(5) NULL DEFAULT NULL,
  `title` MEDIUMTEXT NULL DEFAULT NULL,
  `content` MEDIUMTEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
KEY (`texte_id`),
  UNIQUE KEY (`type`, `texte_id`, `number`)
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
-- Table Properties
-- ---

ALTER TABLE `votes` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `users` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `amendements` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `articles` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `votes_anon` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ---
-- Test Data
-- ---